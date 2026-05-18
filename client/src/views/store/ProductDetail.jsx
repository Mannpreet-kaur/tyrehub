import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { SERVER_URL } from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center p-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:w-1/2 p-12 bg-slate-50 flex items-center justify-center border-r border-slate-200">
            {product.image_path ? (
              <img src={`${SERVER_URL}${product.image_path}`} alt={product.name} className="max-w-full h-auto max-h-[400px] object-contain drop-shadow-xl" />
            ) : (
              <div className="text-slate-400">No Image Available</div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="uppercase tracking-widest text-sm font-bold text-blue-600 mb-2">{product.brand}</div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-slate-900">₹{product.price.toLocaleString()}</span>
              {product.stock > 0 ? (
                <span className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1 rounded-full">In Stock ({product.stock})</span>
              ) : (
                <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">Out of Stock</span>
              )}
            </div>

            <p className="text-slate-600 mb-8 whitespace-pre-wrap">{product.description || 'No description available for this product.'}</p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="block text-slate-500 mb-1">Vehicle Type</span>
                <span className="font-semibold text-slate-900">{product.vehicle_type}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="block text-slate-500 mb-1">Size</span>
                <span className="font-semibold text-slate-900">{product.size}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="block text-slate-500 mb-1">Position</span>
                <span className="font-semibold text-slate-900">{product.position}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <span className="block text-slate-500 mb-1">Type</span>
                <span className="font-semibold text-slate-900">{product.type}</span>
              </div>
            </div>

            <div className="mt-auto flex items-end space-x-4">
              <div className="w-24">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quantity</label>
                <div className="flex bg-slate-100 rounded-md border border-slate-200">
                  <button className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-l-md" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <input type="number" className="w-full text-center bg-transparent outline-none font-semibold" value={quantity} readOnly />
                  <button className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-r-md" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="flex-1 py-4 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
