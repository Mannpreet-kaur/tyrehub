const express = require('express');
const { getDbSync, saveDb, queryAll, queryOne, runSql } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { vehicle_type, brand, size, search, position } = req.query;
    const db = getDbSync();

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (vehicle_type) {
      query += ' AND vehicle_type = ?';
      params.push(vehicle_type);
    }
    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }
    if (size) {
      query += ' AND size LIKE ?';
      params.push(`%${size}%`);
    }
    if (position) {
      query += ' AND (position = ? OR position = ?)';
      params.push(position, 'Both');
    }
    if (search) {
      query += ' AND (name LIKE ? OR size LIKE ? OR brand LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const products = queryAll(db, query, params);
    db.close();

    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDbSync();
    const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
    db.close();

    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/products (admin only)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { name, brand, size, vehicle_type, position, type, price, stock, description } = req.body;
    if (!name || !brand || !size || !vehicle_type || !price) {
      return res.status(400).json({ error: 'Name, brand, size, vehicle_type, and price are required.' });
    }

    const db = getDbSync();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    runSql(db,
      `INSERT INTO products (name, brand, size, vehicle_type, position, type, price, stock, description, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand, size, vehicle_type, position || 'Both', type || 'Tubeless', parseFloat(price), Math.max(0, parseInt(stock) || 0), description || '', imagePath]
    );

    saveDb(db);
    const product = queryOne(db, 'SELECT * FROM products WHERE id = last_insert_rowid()');
    db.close();

    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/products/:id (admin only)
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const db = getDbSync();
    const existing = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);

    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Product not found.' });
    }

    const { name, brand, size, vehicle_type, position, type, price, stock, description } = req.body;
    let imagePath = existing.image_path;

    if (req.file) {
      if (existing.image_path) {
        const oldPath = path.join(__dirname, '..', existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    runSql(db,
      `UPDATE products SET name=?, brand=?, size=?, vehicle_type=?, position=?, type=?, price=?, stock=?, description=?, image_path=? WHERE id=?`,
      [
        name || existing.name, brand || existing.brand, size || existing.size,
        vehicle_type || existing.vehicle_type, position || existing.position,
        type || existing.type, price ? parseFloat(price) : existing.price,
        stock !== undefined ? Math.max(0, parseInt(stock)) : existing.stock,
        description !== undefined ? description : existing.description,
        imagePath, Number(req.params.id)
      ]
    );

    saveDb(db);
    const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
    db.close();

    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/products/:id (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const product = queryOne(db, 'SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);

    if (!product) {
      db.close();
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.image_path) {
      const imgPath = path.join(__dirname, '..', product.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    runSql(db, 'DELETE FROM products WHERE id = ?', [Number(req.params.id)]);
    saveDb(db);
    db.close();

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
