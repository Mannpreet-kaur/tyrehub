const express = require('express');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { getDbSync, saveDb, queryAll, queryOne, runSql } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generatePDFBuffer(order, items) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      let discountAmount = 0;
      if (order.discount_type === 'percentage') discountAmount = order.total_amount * (order.discount_value / 100);
      else if (order.discount_type === 'fixed') discountAmount = order.discount_value;

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('TyreHub', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('G.T. Road, basti adda, jalandhar - 144001', { align: 'center' });
      doc.text('Phone: +91 98765 43210', { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text(`Invoice #INV-${String(order.id).padStart(5, '0')}`);
      doc.fontSize(10).font('Helvetica').text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`);
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.text(`Payment Method: ${order.payment_method}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${order.customer_name}`);
      if (order.customer_email) doc.text(`Email: ${order.customer_email}`);
      doc.text(`Phone: ${order.customer_phone}`);
      if (order.customer_address) doc.text(`Address: ${order.customer_address}`);
      doc.moveDown();

      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('S.No', 50, tableTop, { width: 30 });
      doc.text('Product', 85, tableTop, { width: 180 });
      doc.text('Size', 270, tableTop, { width: 80 });
      doc.text('Qty', 355, tableTop, { width: 40 });
      doc.text('Price', 400, tableTop, { width: 70 });
      doc.text('Total', 475, tableTop, { width: 75 });
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);
      items.forEach((item, index) => {
        doc.text(String(index + 1), 50, y, { width: 30 });
        doc.text(`${item.product_name || item.name} (${item.brand})`, 85, y, { width: 180 });
        doc.text(item.size, 270, y, { width: 80 });
        doc.text(String(item.quantity), 355, y, { width: 40 });
        doc.text(`Rs.${item.unit_price.toFixed(2)}`, 400, y, { width: 70 });
        doc.text(`Rs.${(item.unit_price * item.quantity).toFixed(2)}`, 475, y, { width: 75 });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', 380, y);
      doc.text(`Rs.${order.total_amount.toFixed(2)}`, 475, y);
      y += 18;

      if (order.discount_type !== 'none' && order.discount_value > 0) {
        const label = order.discount_type === 'percentage' ? `Discount (${order.discount_value}%):` : 'Discount (Fixed):';
        doc.text(label, 380, y);
        doc.text(`-Rs.${discountAmount.toFixed(2)}`, 475, y);
        y += 18;
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total Payable:', 380, y);
      doc.text(`Rs.${order.final_amount.toFixed(2)}`, 475, y);
      y += 30;

      doc.fontSize(9).font('Helvetica').text('Thank you for your business!', 50, y, { align: 'center' });
      doc.text('TyreHub - Your Trusted Tyre Partner', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// GET /api/orders (admin only)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const orders = queryAll(db, `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
      FROM orders o JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    db.close();
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDbSync();
    const order = queryOne(db, `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
      FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [Number(req.params.id)]);

    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found.' }); }

    const items = queryAll(db, `
      SELECT oi.*, p.name as product_name, p.brand, p.size
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [Number(req.params.id)]);
    db.close();

    res.json({ ...order, items });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, discount_type, discount_value, payment_method, recaptcha_token } = req.body;
    if (!customer_name || !customer_phone || !customer_email || !items || items.length === 0 || !recaptcha_token) {
      return res.status(400).json({ error: 'Customer name, phone, email, recaptcha, and at least one item are required.' });
    }

    // Verify Recaptcha
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (secretKey) {
        const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha_token}`;
        const recaptchaResponse = await fetch(recaptchaVerifyUrl, { method: 'POST' });
        const recaptchaData = await recaptchaResponse.json();
        
        if (!recaptchaData.success) {
          return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }
    }

    const db = getDbSync();

    // Check stock
    for (const item of items) {
      const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(item.product_id)]);
      if (!product) { db.close(); return res.status(400).json({ error: `Product ID ${item.product_id} not found.` }); }
      if (product.stock < item.quantity) { db.close(); return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` }); }
    }

    // Create/find customer
    let customer = queryOne(db, 'SELECT * FROM customers WHERE phone = ?', [customer_phone]);
    if (!customer) {
      runSql(db, 'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)', [customer_name, customer_phone, customer_email, customer_address || '']);
      customer = queryOne(db, 'SELECT * FROM customers WHERE id = last_insert_rowid()');
    } else {
      runSql(db, 'UPDATE customers SET name = ?, email = ?, address = ? WHERE id = ?', [customer_name, customer_email, customer_address || customer.address, customer.id]);
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of items) {
      const product = queryOne(db, 'SELECT price FROM products WHERE id = ?', [Number(item.product_id)]);
      totalAmount += product.price * item.quantity;
    }

    let discountAmount = 0;
    const dType = discount_type || 'none';
    const dValue = parseFloat(discount_value) || 0;
    if (dType === 'percentage') discountAmount = totalAmount * (dValue / 100);
    else if (dType === 'fixed') discountAmount = dValue;
    const finalAmount = totalAmount - discountAmount;
    
    const pm = payment_method || 'Cash on Delivery';

    // Create order
    runSql(db, `INSERT INTO orders (customer_id, total_amount, discount_type, discount_value, final_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [customer.id, totalAmount, dType, dValue, finalAmount, pm]);
    const order = queryOne(db, 'SELECT * FROM orders WHERE id = last_insert_rowid()');
    const orderId = order.id;

    // Create items and decrement stock
    for (const item of items) {
      const product = queryOne(db, 'SELECT price FROM products WHERE id = ?', [Number(item.product_id)]);
      runSql(db, 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, Number(item.product_id), item.quantity, product.price]);
      runSql(db, 'UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, Number(item.product_id)]);
    }

    // Get Full Order details for PDF
    const fullOrderDetails = queryOne(db, `
        SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
        FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [orderId]);
    const fullOrderItems = queryAll(db, `
        SELECT oi.*, p.name as product_name, p.brand, p.size
        FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [orderId]);

    saveDb(db);
    db.close();

    // Send email asynchronously with PDF Attachment
    generatePDFBuffer(fullOrderDetails, fullOrderItems).then((pdfBuffer) => {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        
        const sendWithTransporter = (transporter) => {
            const message = {
                from: 'TyreHub <noreply@tyrehub.com>',
                to: customer_email,
                subject: `Order Confirmation - #${orderId}`,
                text: `Hi ${customer_name},\n\nThank you for your order! Your order ID is #${orderId}.\nTotal Amount: Rs.${finalAmount.toFixed(2)}\nPayment Method: ${pm}\n\nPlease find your invoice attached as a PDF.\n\nWe will process your order shortly.\n\nThanks,\nTyreHub Team`,
                attachments: [
                    {
                        filename: `Invoice-${orderId}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };
            transporter.sendMail(message, (err, info) => {
                if (err) { return console.log('Error occurred sending mail: ' + err.message); }
                console.log('Message sent: %s', info.messageId);
                if (info.messageId && (!emailUser || emailUser === 'your_gmail_address@gmail.com')) {
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                }
            });
        };

        if (emailUser && emailPass && emailUser !== 'your_gmail_address@gmail.com') {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: emailUser, pass: emailPass }
            });
            sendWithTransporter(transporter);
        } else {
            nodemailer.createTestAccount((err, account) => {
                if (err) { return console.error('Failed to create a testing account. ' + err.message); }
                const transporter = nodemailer.createTransport({
                    host: account.smtp.host,
                    port: account.smtp.port,
                    secure: account.smtp.secure,
                    auth: { user: account.user, pass: account.pass }
                });
                sendWithTransporter(transporter);
            });
        }
    }).catch(err => console.error('PDF Generation Error:', err));

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/orders/:id/status (admin only)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ error: 'Valid status required: pending, confirmed, delivered, or cancelled.' });
    }

    const db = getDbSync();
    const order = queryOne(db, 'SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found.' }); }

    // Restore stock if the order is newly cancelled
    if (status === 'cancelled' && order.status !== 'cancelled') {
        const items = queryAll(db, 'SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        for (const item of items) {
           runSql(db, 'UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
    }

    runSql(db, 'UPDATE orders SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
    saveDb(db);
    const updated = queryOne(db, 'SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    db.close();

    res.json(updated);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/orders/:id (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const orderId = Number(req.params.id);
    const order = queryOne(db, 'SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found.' }); }

    // If the order wasn't cancelled before, restore the stock before deleting
    if (order.status !== 'cancelled') {
        const items = queryAll(db, 'SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
           runSql(db, 'UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
    }

    // Delete associated order items
    runSql(db, 'DELETE FROM order_items WHERE order_id = ?', [orderId]);
    // Delete the order
    runSql(db, 'DELETE FROM orders WHERE id = ?', [orderId]);

    saveDb(db);
    db.close();
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/orders/:id/invoice/pdf
router.get('/:id/invoice/pdf', async (req, res) => {
  try {
    const db = getDbSync();
    const order = queryOne(db, `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
      FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [Number(req.params.id)]);

    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found.' }); }

    const items = queryAll(db, `
      SELECT oi.*, p.name as product_name, p.brand, p.size
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [Number(req.params.id)]);
    db.close();

    const pdfBuffer = await generatePDFBuffer(order, items);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
