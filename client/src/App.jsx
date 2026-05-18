import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Storefront Components
import { StoreLayout } from './components/Layout/StoreLayout';
import { Home } from './views/store/Home';
import { ProductsListing } from './views/store/ProductsListing';
import { ProductDetail } from './views/store/ProductDetail';
import { Cart } from './views/store/Cart';
import { Checkout } from './views/store/Checkout';
import { OrderConfirmation } from './views/store/OrderConfirmation';
import { OrderTracking } from './views/store/OrderTracking';

// Admin Components
import { AdminLayout } from './components/Layout/AdminLayout';
import { Login } from './views/admin/Login';
import { Dashboard } from './views/admin/Dashboard';
import { Products } from './views/admin/Products';
import { Categories } from './views/admin/Categories';
import { Orders } from './views/admin/Orders';
import { Billing } from './views/admin/Billing';
import { Reports } from './views/admin/Reports';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <AuthProvider>
        <CartProvider>
          <div className="font-sans antialiased text-slate-900 min-h-screen bg-slate-50">
            <Routes>
              {/* Customer Facing Storefront */}
              <Route path="/" element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<ProductsListing />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmation" element={<OrderConfirmation />} />
                <Route path="track-order" element={<OrderTracking />} />
              </Route>

              {/* Admin Portal Authentication */}
              <Route path="/admin/login" element={<Login />} />

              {/* Protected Admin Portal */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="billing" element={<Billing />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
