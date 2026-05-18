import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiPieChart, FiBox, FiList, FiDollarSign, 
  FiShoppingCart, FiBarChart2, FiLogOut 
} from 'react-icons/fi';
import { GiCarWheel } from 'react-icons/gi';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/admin/login" />;

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiPieChart },
    { name: 'Products', href: '/admin/products', icon: FiBox },
    { name: 'Categories', href: '/admin/categories', icon: FiList },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingCart },
    { name: 'POS Billing', href: '/admin/billing', icon: FiDollarSign },
    { name: 'Reports', href: '/admin/reports', icon: FiBarChart2 },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <GiCarWheel className="h-8 w-8 text-blue-500 mr-3" />
          <span className="text-xl font-bold tracking-tight">TyreHub <span className="font-normal text-slate-400 text-sm">Admin</span></span>
        </div>
        <div className="flex-1 overflow-y-auto pt-6 px-4 pb-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/admin');
            return (
              <Link 
                key={item.name} 
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-medium text-slate-300">Hello, {user.username}</span>
          </div>
          <button 
            onClick={logout} 
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 flex justify-between items-center bg-white shadow-sm px-8 z-10">
          <h1 className="text-2xl font-semibold text-slate-800">
            {navigation.find(n => n.href === location.pathname || (location.pathname.startsWith(n.href) && n.href !== '/admin'))?.name || 'Dashboard'}
          </h1>
          <div>
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
              View Storefront <span className="ml-1">→</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
