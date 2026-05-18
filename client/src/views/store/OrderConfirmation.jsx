import { useLocation, Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import api from '../../api/axios';

export function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/" />;

  const handleDownloadInvoice = () => {
    const baseURL = api.defaults.baseURL;
    window.open(`${baseURL}/orders/${order.id}/invoice/pdf`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-emerald-100">
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Order Successful!</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
          Thank you for choosing TyreHub. Your order has been placed and is currently being processed.
        </p>

        <div className="bg-slate-50 rounded-xl p-6 inline-block text-left border border-slate-200 mb-10 w-full sm:w-auto min-w-[300px]">
          <div className="text-sm text-slate-500 mb-1">Order Tracking ID</div>
          <div className="text-3xl font-mono tracking-widest font-bold text-slate-900 mb-4">#{order.id}</div>
          <div className="text-sm text-slate-500 mb-1">Total Paid</div>
          <div className="text-xl font-bold text-slate-900">₹{order.final_amount.toLocaleString()}</div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" onClick={handleDownloadInvoice} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            📄 Download Invoice (PDF)
          </Button>
          <Link to="/track-order" state={{ orderId: order.id }}>
            <Button size="lg" className="w-full sm:w-auto">Track Order</Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
