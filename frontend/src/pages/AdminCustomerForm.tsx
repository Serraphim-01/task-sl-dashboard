import React, { useState } from 'react';
import { createCustomer } from '../services/api.ts';

const AdminCustomerForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    enterprise_name: '',
    starlink_client_id: '',
    starlink_client_secret: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await createCustomer(formData);
      setMessage({ type: 'success', text: `Customer created successfully! User ID: ${response.user_id}` });
      // Reset form
      setFormData({
        email: '',
        enterprise_name: '',
        starlink_client_id: '',
        starlink_client_secret: '',
        password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create customer';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Create New Customer</h2>
      
      {message && (
        <div
          className={`p-4 mb-6 rounded border ${
            message.type === 'success' 
              ? 'bg-green-900/50 border-green-700 text-green-200' 
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-semibold text-starlink-text">
            Email:
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
            Enterprise Name:
          </label>
          <input
            type="text"
            name="enterprise_name"
            value={formData.enterprise_name}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-starlink-text">
            Starlink Client ID:
          </label>
          <input
            type="text"
            name="starlink_client_id"
            value={formData.starlink_client_id}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-starlink-text">
            Starlink Client Secret:
          </label>
          <input
            type="password"
            name="starlink_client_secret"
            value={formData.starlink_client_secret}
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
            minLength={8}
            className="input-field"
          />
          <small className="text-starlink-text-muted mt-1 block">
            Must be at least 8 characters with uppercase, lowercase, and digit
          </small>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-starlink-text">
            Confirm Password:
          </label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
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
          {loading ? 'Creating...' : 'Create Customer'}
        </button>
      </form>
    </div>
  );
};

export default AdminCustomerForm;
