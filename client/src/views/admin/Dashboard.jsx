import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { FiDollarSign, FiBox, FiAlertCircle, FiShoppingCart } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!stats) return <div className="text-red-500 p-8">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Products</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalProducts}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <FiBox className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Sales</p>
              <h3 className="text-3xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalOrders}</h3>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <FiShoppingCart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.lowStockProducts > 0 ? 'bg-red-50 border-red-200' : ''}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stats.lowStockProducts > 0 ? 'text-red-600' : 'text-slate-500'} mb-1`}>Low Stock Items</p>
              <h3 className={`text-3xl font-bold ${stats.lowStockProducts > 0 ? 'text-red-700' : 'text-slate-900'}`}>{stats.lowStockProducts}</h3>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stats.lowStockProducts > 0 ? 'bg-red-200 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <FiAlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <p className="text-slate-500 text-sm">All products are sufficiently stocked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Product</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Remaining Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.lowStockItems.map(product => (
                      <tr key={product.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link to="/admin/products" className="hover:text-blue-600">{product.name} ({product.brand})</Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {product.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">ID</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentOrders.slice(0, 5).map(order => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-slate-500">#{order.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{order.customer_name}</td>
                        <td className="px-4 py-3">₹{order.final_amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                            ${order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
