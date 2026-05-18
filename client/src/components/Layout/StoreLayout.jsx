import { Link, Outlet } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FiShoppingCart, FiSearch } from 'react-icons/fi';
import { GiCarWheel } from 'react-icons/gi';
import { ChatWidget } from '../ChatWidget';

export function StoreLayout() {
  const { cartCount } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <GiCarWheel className="h-8 w-8 text-blue-500" />
              <span className="font-bold text-xl tracking-tight">TyreHub</span>
            </Link>
            
            {/* Desktop Navbar */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <Link to="/products" className="hover:text-blue-400 transition-colors">Shop Tyres</Link>
              <Link to="/track-order" className="hover:text-blue-400 transition-colors">Track Order</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative group">
                <div className="p-2 bg-slate-800 rounded-full group-hover:bg-slate-700 transition">
                  <FiShoppingCart className="h-5 w-5" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Content */}
      <main className="flex-grow bg-slate-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GiCarWheel className="h-6 w-6 text-slate-500" />
            <span className="font-semibold text-lg text-slate-300">TyreHub</span>
          </div>
          <p>© {new Date().getFullYear()} TyreHub. All rights reserved.</p>
          <div className="mt-4 flex justify-center space-x-4">
            <Link to="/admin" className="text-sm hover:text-white transition">Admin Portal</Link>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
