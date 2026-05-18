import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export function OrderTracking() {
  const { state } = useLocation();
  const [orderId, setOrderId] = useState(state?.orderId || '');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state?.orderId) handleTrack(null, state.orderId);
  }, []);

  const handleTrack = async (e, idToTrack = orderId) => {
    if (e) e.preventDefault();
    if (!idToTrack) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${idToTrack}`);
      setOrderData(data);
    } catch (error) {
      console.error(error);
      setOrderData(null);
      toast.error('Order not found. Please check your Tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!orderData) return;
    const baseURL = api.defaults.baseURL;
    window.open(`${baseURL}/orders/${orderData.id}/invoice/pdf`, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Track Your Order</h1>
        <p className="text-slate-600">Enter your order ID below to see its current status and details.</p>
      </div>

      <Card className="mb-10">
        <CardContent className="p-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <Input 
              value={orderId} 
              onChange={e => setOrderId(e.target.value)} 
              placeholder="e.g. 1" 
              className="flex-1 text-lg" 
            />
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Tracking...' : 'Track'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {orderData && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Order #{orderData.id}</div>
                <div className="text-lg font-bold text-slate-900">{new Date(orderData.created_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 sm:mt-0">
                <Button onClick={handleDownloadInvoice} variant="outline" size="sm" className="bg-white">
                  📄 Download PDF
                </Button>
                <div className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm ${getStatusColor(orderData.status)}`}>
                  {orderData.status}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Customer Details</h3>
                <div className="font-medium text-slate-900">{orderData.customer_name}</div>
                <div className="text-slate-600">{orderData.customer_phone}</div>
                {orderData.customer_address && <div className="text-slate-600 mt-1">{orderData.customer_address}</div>}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Payment Info</h3>
                <div className="text-slate-600 flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orderData.total_amount.toLocaleString()}</span>
                </div>
                {orderData.discount_value > 0 && (
                  <div className="text-emerald-600 flex justify-between text-sm mt-1">
                    <span>Discount</span>
                    <span>- {orderData.discount_type === 'percentage' ? `${orderData.discount_value}%` : `₹${orderData.discount_value}`}</span>
                  </div>
                )}
                <div className="font-bold text-slate-900 text-lg flex justify-between mt-2 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span>₹{orderData.final_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-4">Order Items</h3>
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {orderData.items.map(item => (
                  <li key={item.id} className="p-4 flex justify-between items-center bg-slate-50">
                    <div>
                      <span className="font-medium text-slate-900 block">{item.product_name}</span>
                      <span className="text-sm text-slate-500">{item.brand} • {item.size}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-medium">Qty: {item.quantity}</span>
                      <span className="text-sm text-slate-500">₹{item.unit_price.toLocaleString()} each</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
