import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

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
    <div className="max-w-md mx-auto my-24 p-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-starlink-text">Admin Login</h2>
      
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
  );
};

export default AdminLogin;

