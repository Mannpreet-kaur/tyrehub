import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2, FiPrinter } from 'react-icons/fi';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

const COUNTRIES = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1',  flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', dial: '+1',  flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'RU', dial: '+7',  flag: '🇷🇺', name: 'Russia' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
];

export function Billing() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  // POS State
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', address: '', country_code: 'IN' });
  const [discount, setDiscount] = useState({ type: 'none', value: 0 }); // none, fixed, percentage
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products');
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.size.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Out of stock!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Maximum stock reached');
          return prev;
        }
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: product.id, product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.product_id !== id));
  
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = discount.type === 'percentage' 
    ? subtotal * (discount.value / 100) 
    : discount.type === 'fixed' ? Number(discount.value) : 0;
  const total = subtotal - discountAmount;

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue.length < customerInfo.phone.length) {
       const formatter = new AsYouType(customerInfo.country_code);
       setCustomerInfo({ ...customerInfo, phone: formatter.input(inputValue) });
       return;
    }
    const formatter = new AsYouType(customerInfo.country_code);
    const formattedValue = formatter.input(inputValue);
    const oldParsed = parsePhoneNumberFromString(customerInfo.phone, customerInfo.country_code);
    const newParsed = parsePhoneNumberFromString(formattedValue, customerInfo.country_code);

    if (oldParsed && oldParsed.isValid() && (!newParsed || !newParsed.isValid())) {
        return;
    }
    setCustomerInfo({ ...customerInfo, phone: formattedValue });
  };

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!customerInfo.name || !customerInfo.phone) return toast.error('Customer name and phone required');

    const phoneNumber = parsePhoneNumberFromString(customerInfo.phone, customerInfo.country_code);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return toast.error('Please enter a valid phone number.');
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: customerInfo.name,
        customer_phone: phoneNumber.number, // E.164
        customer_email: customerInfo.email,
        customer_address: customerInfo.address,
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        discount_type: discount.type,
        discount_value: discount.value,
      };

      // Create order first
      const orderResponse = await api.post('/billing/manual', payload);
      const orderId = orderResponse.data.order_id;

      // Then fetch the PDF invoice blob
      const pdfResponse = await api.get(`/billing/${orderId}/invoice/pdf`, { responseType: 'blob' });
      
      // Download PDF
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      toast.success('Invoice generated & order placed!');
      
      // Reset
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '', address: '', country_code: 'IN' });
      setDiscount({ type: 'none', value: 0 });
      
      // refetch products to update stock
      const { data } = await api.get('/products');
      setProducts(data);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Product Selection */}
      <Card className="w-1/2 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
          <Input 
            placeholder="Search products to add..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className={`bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow 
                  ${product.stock === 0 ? 'opacity-50 border-red-200' : 'border-slate-200'}`}
              >
                <div className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{product.name}</div>
                <div className="text-xs text-slate-500 mb-2">{product.size}</div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-bold text-slate-900">₹{product.price.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${product.stock > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* POS Cart / Invoice */}
      <Card className="flex-1 flex flex-col h-full bg-slate-50 border-r-0 border-t-0 border-b-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="p-4 bg-white border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-900">Current Sale</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Customer Info Form */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 shrink-0">
            <h3 className="text-xs font-bold uppercase text-slate-500">Customer Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Full Name *" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
              
              <div className="flex space-x-2">
                <div className="w-1/3">
                  <select
                    value={customerInfo.country_code}
                    onChange={e => setCustomerInfo({...customerInfo, country_code: e.target.value, phone: ''})}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                </div>
                <div className="w-2/3">
                  <Input placeholder="Mobile *" value={customerInfo.phone} onChange={handlePhoneChange} />
                </div>
              </div>
              
              <Input placeholder="Email Address" type="email" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} />
              <Input placeholder="Delivery Address" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-[150px]">
              <ul className="divide-y divide-slate-100">
                {cart.map(item => (
                  <li key={item.product_id} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 line-clamp-1">{item.product.name}</div>
                      <div className="text-xs text-slate-500">₹{item.product.price.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-slate-100 rounded border border-slate-200">
                        <button className="px-2 hover:bg-slate-200" onClick={() => updateQty(item.product_id, -1)}>-</button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button className="px-2 hover:bg-slate-200" onClick={() => updateQty(item.product_id, 1)}>+</button>
                      </div>
                      <div className="w-20 text-right font-medium text-sm text-slate-900">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600">
                        <FiTrash2 />
                      </button>
                    </div>
                  </li>
                ))}
                {cart.length === 0 && <li className="p-8 text-center text-slate-400 text-sm">Cart is empty</li>}
              </ul>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Discount</span>
                <div className="flex bg-white rounded border border-slate-200 overflow-hidden text-sm">
                  <select 
                    className="bg-transparent px-2 py-1 border-r border-slate-200 outline-none"
                    value={discount.type}
                    onChange={e => setDiscount({ ...discount, type: e.target.value })}
                  >
                    <option value="none">None</option>
                    <option value="fixed">₹</option>
                    <option value="percentage">%</option>
                  </select>
                  <input 
                    type="number" 
                    className="w-16 px-2 text-right outline-none bg-transparent" 
                    value={discount.value} 
                    onChange={e => setDiscount({ ...discount, value: e.target.value })}
                    disabled={discount.type === 'none'}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <Button 
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
            disabled={cart.length === 0 || loading}
            onClick={handleGenerateInvoice}
          >
            {loading ? 'Processing...' : <><FiPrinter className="mr-2 h-5 w-5" /> Generate Invoice & Place Order</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
