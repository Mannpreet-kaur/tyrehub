const express = require('express');
const { getDbSync, saveDb, queryAll, queryOne, runSql } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const db = getDbSync();
    const categories = queryAll(db, 'SELECT * FROM categories ORDER BY name');
    db.close();
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/categories (admin only)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const db = getDbSync();
    const existing = queryOne(db, 'SELECT * FROM categories WHERE name = ?', [name]);
    if (existing) { db.close(); return res.status(409).json({ error: 'Category already exists.' }); }

    runSql(db, 'INSERT INTO categories (name) VALUES (?)', [name]);
    saveDb(db);
    const category = queryOne(db, 'SELECT * FROM categories WHERE id = last_insert_rowid()');
    db.close();

    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const db = getDbSync();
    const existing = queryOne(db, 'SELECT * FROM categories WHERE id = ?', [Number(req.params.id)]);
    if (!existing) { db.close(); return res.status(404).json({ error: 'Category not found.' }); }

    runSql(db, 'UPDATE categories SET name = ? WHERE id = ?', [name, Number(req.params.id)]);
    saveDb(db);
    const category = queryOne(db, 'SELECT * FROM categories WHERE id = ?', [Number(req.params.id)]);
    db.close();

    res.json(category);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const existing = queryOne(db, 'SELECT * FROM categories WHERE id = ?', [Number(req.params.id)]);
    if (!existing) { db.close(); return res.status(404).json({ error: 'Category not found.' }); }

    runSql(db, 'DELETE FROM categories WHERE id = ?', [Number(req.params.id)]);
    saveDb(db);
    db.close();

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
