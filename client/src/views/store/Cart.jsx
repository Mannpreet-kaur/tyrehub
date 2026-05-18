import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { FiTrash2 } from 'react-icons/fi';
import { SERVER_URL } from '../../api/axios';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
          <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <FiTrash2 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Cart is Empty</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Browse our top-quality tyres and find the perfect fit for your vehicle.</p>
          <Link to="/products">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>
      
      <div className="lg:flex lg:space-x-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ul className="divide-y divide-slate-200">
              {cart.map((item) => (
                <li key={item.product_id} className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:bg-slate-50 transition-colors">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-200 p-2">
                    {item.product.image_path ? (
                      <img src={`${SERVER_URL}${item.product.image_path}`} alt={item.product.name} className="max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-xs text-slate-400">No Image</span>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-sm font-semibold text-blue-600 mb-1">{item.product.brand}</div>
                    <Link to={`/products/${item.product_id}`} className="font-bold text-slate-900 hover:underline">{item.product.name}</Link>
                    <div className="text-sm text-slate-500 mt-1">Size: {item.product.size}</div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-3">
                    <div className="font-bold text-lg text-slate-900">₹{(item.unit_price * item.quantity).toLocaleString()}</div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-slate-100 rounded-md border border-slate-200">
                        <button className="px-2 py-1 text-slate-600 hover:bg-slate-200" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                        <span className="px-3 font-medium text-sm">{item.quantity}</span>
                        <button className="px-2 py-1 text-slate-600 hover:bg-slate-200" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3 mt-8 lg:mt-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fitting Services</span>
                <span className="font-medium text-emerald-600">Complimentary</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes (Included)</span>
                <span className="font-medium text-slate-900">₹0</span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-slate-900">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <Link to="/checkout" className="block">
              <Button size="lg" className="w-full text-lg py-4">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
