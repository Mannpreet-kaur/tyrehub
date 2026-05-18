const express = require('express');
const { getDbSync, queryAll, queryOne } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();

    const totalProducts = queryOne(db, 'SELECT COUNT(*) as count FROM products').count;
    const totalOrders = queryOne(db, 'SELECT COUNT(*) as count FROM orders').count;
    const totalRevenue = queryOne(db, 'SELECT COALESCE(SUM(final_amount), 0) as total FROM orders').total;
    const pendingOrders = queryOne(db, "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").count;
    const lowStockProducts = queryOne(db, 'SELECT COUNT(*) as count FROM products WHERE stock < 5').count;

    const recentOrders = queryAll(db, `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    const lowStockItems = queryAll(db, 'SELECT id, name, brand, stock FROM products WHERE stock < 5 ORDER BY stock ASC');
    db.close();

    res.json({ totalProducts, totalOrders, totalRevenue, pendingOrders, lowStockProducts, recentOrders, lowStockItems });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
