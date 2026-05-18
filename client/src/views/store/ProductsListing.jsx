import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { SERVER_URL } from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ProductsListing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, [category]); // refetch when category changes

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { vehicle_type: category, search } }),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm sticky top-24">
          <h3 className="font-bold text-lg mb-4">Filters</h3>
          
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <div className="flex gap-2">
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Brand, size..." 
              />
              <Button type="submit" variant="secondary" className="px-3">Go</Button>
            </div>
          </form>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
            <div className="space-y-2">
              <div 
                className={`cursor-pointer px-3 py-2 rounded-md text-sm transition ${category === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                onClick={() => setCategory('')}
              >
                All Vehicles
              </div>
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm transition ${category === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                  onClick={() => setCategory(cat.name)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-6 text-slate-900">
          {category ? `${category} Tyres` : 'All Tyres'}
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
            <p className="text-slate-500 text-lg">No tyres found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setCategory(''); }}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Link to={`/products/${product.id}`} key={product.id}>
                <Card className="h-full hover:shadow-md transition-shadow group overflow-hidden flex flex-col">
                  {product.image_path ? (
                    <div className="h-48 w-full bg-slate-100 p-4 flex items-center justify-center">
                      <img src={`${SERVER_URL}${product.image_path}`} alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">{product.brand}</div>
                    <h3 className="font-bold text-slate-900 line-clamp-1 mb-1">{product.name}</h3>
                    <div className="text-sm text-slate-500 mb-4">{product.size} • {product.position}</div>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-xl font-bold text-slate-900">₹{product.price.toLocaleString()}</div>
                      {product.stock > 0 ? (
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">In Stock</span>
                      ) : (
                        <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
