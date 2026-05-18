import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name });
        toast.success('Category updated');
      } else {
        await api.post('/categories', { name });
        toast.success('Category added');
      }
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Categories</h1>

      <Card>
        <CardContent className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Category Name (e.g. Car, Truck)" 
              required 
            />
            <Button type="submit" className="whitespace-nowrap">
              {editingId ? 'Update Category' : <><FiPlus className="mr-2" /> Add Category</>}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(''); }}>
                Cancel
              </Button>
            )}
          </form>
        </CardContent>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {categories.map(cat => (
              <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <span className="font-medium text-slate-900">{cat.name}</span>
                <div className="flex space-x-2">
                  <button onClick={() => startEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="p-8 text-center text-slate-500">No categories found. Add one above.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
