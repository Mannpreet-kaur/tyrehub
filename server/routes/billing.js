const express = require('express');
const PDFDocument = require('pdfkit');
const { getDbSync, saveDb, queryAll, queryOne, runSql } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/billing/manual
router.post('/manual', authMiddleware, (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, discount_type, discount_value } = req.body;
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer info and items are required.' });
    }

    const db = getDbSync();

    for (const item of items) {
      const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(item.product_id)]);
      if (!product) { db.close(); return res.status(400).json({ error: `Product ID ${item.product_id} not found.` }); }
      if (product.stock < item.quantity) { db.close(); return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` }); }
    }

    let customer = queryOne(db, 'SELECT * FROM customers WHERE phone = ?', [customer_phone]);
    if (!customer) {
      runSql(db, 'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)', [customer_name, customer_phone, customer_email || '', customer_address || '']);
      customer = queryOne(db, 'SELECT * FROM customers WHERE id = last_insert_rowid()');
    } else {
      runSql(db, 'UPDATE customers SET name = ?, email = ?, address = ? WHERE id = ?', [customer_name, customer_email || customer.email, customer_address || customer.address, customer.id]);
    }

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

    runSql(db, `INSERT INTO orders (customer_id, total_amount, discount_type, discount_value, final_amount, status) VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [customer.id, totalAmount, dType, dValue, finalAmount]);
    const order = queryOne(db, 'SELECT * FROM orders WHERE id = last_insert_rowid()');

    for (const item of items) {
      const product = queryOne(db, 'SELECT price FROM products WHERE id = ?', [Number(item.product_id)]);
      runSql(db, 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [order.id, Number(item.product_id), item.quantity, product.price]);
      runSql(db, 'UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, Number(item.product_id)]);
    }

    saveDb(db);
    db.close();
    res.status(201).json({ message: 'Manual bill created successfully!', order_id: order.id });
  } catch (err) {
    console.error('Manual billing error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/billing/:id/invoice
router.get('/:id/invoice', (req, res) => {
  try {
    const db = getDbSync();
    const order = queryOne(db, `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
      FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [Number(req.params.id)]);

    if (!order) { db.close(); return res.status(404).json({ error: 'Order not found.' }); }

    const items = queryAll(db, `
      SELECT oi.*, p.name as product_name, p.brand, p.size, p.vehicle_type
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [Number(req.params.id)]);
    db.close();

    let discountAmount = 0;
    if (order.discount_type === 'percentage') discountAmount = order.total_amount * (order.discount_value / 100);
    else if (order.discount_type === 'fixed') discountAmount = order.discount_value;

    res.json({
      shop_name: 'TyreHub',
      shop_address: 'G.T. Road, basti adda, jalandhar - 144001',
      shop_phone: '+91 98765 43210',
      invoice_number: `INV-${String(order.id).padStart(5, '0')}`,
      date: order.created_at,
      customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone, address: order.customer_address },
      items: items.map(i => ({
        name: i.product_name, brand: i.brand, size: i.size, vehicle_type: i.vehicle_type,
        quantity: i.quantity, unit_price: i.unit_price, total: i.unit_price * i.quantity
      })),
      subtotal: order.total_amount,
      discount_type: order.discount_type,
      discount_value: order.discount_value,
      discount_amount: discountAmount,
      final_amount: order.final_amount,
      status: order.status
    });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/billing/:id/invoice/pdf
router.get('/:id/invoice/pdf', (req, res) => {
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

    let discountAmount = 0;
    if (order.discount_type === 'percentage') discountAmount = order.total_amount * (order.discount_value / 100);
    else if (order.discount_type === 'fixed') discountAmount = order.discount_value;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
    doc.pipe(res);

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
      doc.text(`${item.product_name} (${item.brand})`, 85, y, { width: 180 });
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
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
