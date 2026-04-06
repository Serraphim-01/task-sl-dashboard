import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FaUser } from 'react-icons/fa';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already admin, redirect
  if (isAdmin) {
    navigate('/admin/customers');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      navigate('/admin/customers');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Admin login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-starlink-dark flex items-center justify-center relative px-4 py-8">
      {/* Customer Login Icon - Top Right */}
      <Link 
        to="/login" 
        className="absolute top-4 right-4 md:top-6 md:right-6 text-starlink-text-muted hover:text-starlink-text transition-colors duration-200"
        title="Customer Login"
      >
        <FaUser size={24} className="md:!w-7 md:!h-7" />
      </Link>

      <div className="w-full max-w-md p-6 md:p-8 card">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-starlink-text">Admin Login</h2>
        
        {error && (
          <div className="p-4 mb-6 rounded bg-red-900/50 border border-red-700 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-starlink-text">
              Admin Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-starlink-text">
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

