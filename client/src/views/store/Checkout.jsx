import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
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

export function Checkout() {
  const { cart, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country_code: 'IN',
    address: '',
    payment_method: 'Cash on Delivery',
    recaptcha_token: ''
  });

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    if (e.target.name === 'country_code') {
      setFormData({ ...formData, country_code: e.target.value, phone: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    
    // Always allow deletion
    if (inputValue.length < formData.phone.length) {
       const formatter = new AsYouType(formData.country_code);
       setFormData({ ...formData, phone: formatter.input(inputValue) });
       return;
    }

    const formatter = new AsYouType(formData.country_code);
    const formattedValue = formatter.input(inputValue);
    
    const oldParsed = parsePhoneNumberFromString(formData.phone, formData.country_code);
    const newParsed = parsePhoneNumberFromString(formattedValue, formData.country_code);

    // If the current number is already a complete, valid number, 
    // and adding a new digit makes it invalid (too long), we block the input.
    if (oldParsed && oldParsed.isValid() && (!newParsed || !newParsed.isValid())) {
        return;
    }

    setFormData({ ...formData, phone: formattedValue });
  };

  const onRecaptchaChange = (value) => {
    setFormData({ ...formData, recaptcha_token: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Name, Email and Phone are required.');
      return;
    }
    
    if (!formData.recaptcha_token) {
      toast.error('Please complete the reCAPTCHA.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address.');
        return;
    }

    const phoneNumber = parsePhoneNumberFromString(formData.phone, formData.country_code);
    if (!phoneNumber || !phoneNumber.isValid()) {
      toast.error('Please enter a valid phone number for the selected country.');
      return;
    }
    
    setLoading(true);
    try {
      const orderPayload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: phoneNumber.number, // E.164 formatted
        customer_address: formData.address,
        payment_method: formData.payment_method,
        recaptcha_token: formData.recaptcha_token,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };
      
      const { data } = await api.post('/orders', orderPayload);
      clearCart();
      
      // Automatically download the PDF invoice immediately after placing order
      const baseURL = api.defaults.baseURL;
      window.open(`${baseURL}/orders/${data.order.id}/invoice/pdf`, '_blank');
      
      navigate('/order-confirmation', { state: { order: data.order } });
    } catch (error) {
      console.error('Checkout error', error);
      toast.error(error.response?.data?.error || 'Failed to place order. Try again.');
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setFormData({ ...formData, recaptcha_token: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
      
      <div className="md:flex md:space-x-8">
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit}>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-6">
              <h2 className="text-xl font-bold mb-6">Customer Details</h2>
              <div className="space-y-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <Input name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <div className="flex space-x-2">
                    <div className="w-1/3">
                      <select
                        name="country_code"
                        value={formData.country_code}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.dial} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-2/3">
                      <Input name="phone" value={formData.phone} onChange={handlePhoneChange} required placeholder="Mobile number" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fitting/Delivery Address</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter workshop address if mobile fitting required, or skip if visiting shop."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-6">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>
              <div className="border border-emerald-500 bg-emerald-50 rounded-lg p-4 flex items-center mb-4 cursor-pointer">
                <input type="radio" id="cod" name="payment_method" value="Cash on Delivery" checked readOnly className="w-5 h-5 text-emerald-600 border-emerald-300 focus:ring-emerald-500 cursor-pointer" />
                <label htmlFor="cod" className="ml-3 flex flex-col cursor-pointer">
                  <span className="font-semibold text-emerald-900 flex items-center gap-2">
                    🚚 Cash on Delivery (COD)
                  </span>
                  <span className="text-sm text-emerald-700 mt-1">
                    You will pay ₹{totalAmount.toLocaleString()} at the time of delivery.
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6 flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={onRecaptchaChange}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Order'}
            </Button>
          </form>
        </div>

        <div className="md:w-1/3 mt-8 md:mt-0">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Summary</h2>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-slate-600 line-clamp-1 pr-4">{item.quantity}x {item.product.name}</span>
                  <span className="font-medium">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
