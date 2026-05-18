const express = require('express');
const { getDbSync, queryAll, queryOne } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/sales?from=&to=
router.get('/sales', authMiddleware, (req, res) => {
  try {
    const { from, to } = req.query;
    const db = getDbSync();

    let dateFilter = '';
    const params = [];

    if (from && to) {
      dateFilter = 'WHERE o.created_at >= ? AND o.created_at <= ?';
      params.push(from, to + ' 23:59:59');
    } else if (from) {
      dateFilter = 'WHERE o.created_at >= ?';
      params.push(from);
    } else if (to) {
      dateFilter = 'WHERE o.created_at <= ?';
      params.push(to + ' 23:59:59');
    }

    const dailyRevenue = queryAll(db, `
      SELECT DATE(o.created_at) as date, SUM(o.final_amount) as revenue, COUNT(*) as order_count
      FROM orders o ${dateFilter}
      GROUP BY DATE(o.created_at) ORDER BY date DESC
    `, params);

    const mostSoldProducts = queryAll(db, `
      SELECT p.name, p.brand, p.size, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${dateFilter}
      GROUP BY oi.product_id ORDER BY total_sold DESC LIMIT 10
    `, params);

    const totalStats = queryOne(db, `
      SELECT COUNT(*) as total_orders, COALESCE(SUM(o.final_amount), 0) as total_revenue
      FROM orders o ${dateFilter}
    `, params);

    db.close();

    res.json({
      dailyRevenue,
      mostSoldProducts,
      totalOrders: totalStats.total_orders,
      totalRevenue: totalStats.total_revenue
    });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
