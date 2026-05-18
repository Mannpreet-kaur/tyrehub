import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { GiCarWheel } from 'react-icons/gi';

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(formData.username, formData.password);
    if (success) navigate('/admin');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <GiCarWheel className="mx-auto h-16 w-16 text-blue-500" />
        <h2 className="mt-4 text-3xl font-extrabold text-white">TyreHub Admin Portal</h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to manage your shop</p>
      </div>

      <Card className="w-full max-w-md bg-white text-slate-900 border-none shadow-2xl">
        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <Input 
                value={formData.username} 
                onChange={e => setFormData({ ...formData, username: e.target.value })} 
                required 
                placeholder="Enter admin username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-8 text-center text-sm text-slate-500">
        Default credentials testing: username `admin`, password `admin123`
      </div>
    </div>
  );
}
