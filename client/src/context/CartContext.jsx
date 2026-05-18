import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity + quantity > product.stock) {
          toast.error(`Only ${product.stock} items left in stock.`);
          return prev;
        }
        toast.success(`Updated ${product.name} quantity in cart.`);
        return prev.map(item => 
          item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      if (product.stock < quantity) {
        toast.error(`Not enough stock for ${product.name}`);
        return prev;
      }
      toast.success(`${product.name} added to cart!`);
      return [...prev, { product_id: product.id, product, quantity, unit_price: product.price }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (quantity > item.product.stock) {
          toast.error(`Only ${item.product.stock} items available.`);
          return item;
        }
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
