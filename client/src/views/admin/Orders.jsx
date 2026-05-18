import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const viewOrderDetails = async (id) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setSelectedOrder(data);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this order? This will restore the stock and remove the order from history.')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order deleted successfully');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
      case 'confirmed': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Confirmed</span>;
      case 'delivered': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'cancelled': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Orders List */}
      <Card className="w-1/2 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-900">
          Recent Orders
        </div>
        <div className="overflow-y-auto flex-1 p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orders.map(order => (
                <li 
                  key={order.id} 
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition ${selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                  onClick={() => viewOrderDetails(order.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-slate-900">Order #{order.id}</div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="text-sm text-slate-600 truncate mb-2">{order.customer_name}</div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="font-bold text-slate-900">₹{order.final_amount.toLocaleString()}</span>
                  </div>
                </li>
              ))}
              {orders.length === 0 && <li className="p-8 text-center text-slate-500">No orders found.</li>}
            </ul>
          )}
        </div>
      </Card>

      {/* Order Details */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedOrder ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Order #{selectedOrder.id}</h2>
                <div className="text-sm text-slate-500">{new Date(selectedOrder.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2 items-center">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedOrder.id, 'confirmed')}>Confirm</Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateStatus(selectedOrder.id, 'cancelled')}>Cancel</Button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                   <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(selectedOrder.id, 'delivered')}>Mark Delivered</Button>
                )}
                {selectedOrder.status === 'delivered' && getStatusBadge('delivered')}
                {selectedOrder.status === 'cancelled' && getStatusBadge('cancelled')}
                
                <button onClick={() => deleteOrder(selectedOrder.id)} className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Customer Information</h3>
                  <div className="font-semibold text-slate-900">{selectedOrder.customer_name}</div>
                  <div className="text-slate-600 text-sm mt-1">{selectedOrder.customer_phone}</div>
                  <div className="text-slate-600 text-sm mt-1">{selectedOrder.customer_address}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Payment Summary</h3>
                  <div className="flex justify-between text-sm mb-1 text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_value > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount_type === 'fixed' ? selectedOrder.discount_value : (selectedOrder.total_amount * selectedOrder.discount_value / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                    <span>Total Paid</span>
                    <span>₹{selectedOrder.final_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 mb-4">Order Items</h3>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.product_name}</div>
                        <div className="text-xs text-slate-500">{item.size} • {item.brand}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">₹{item.unit_price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{(item.quantity * item.unit_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Select an order from the list to view details.
          </div>
        )}
      </Card>
    </div>
  );
}
