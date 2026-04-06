import React, { useState, useEffect } from 'react';
import { listUsers, deleteUser, createCustomer, getWebSocketToken } from '../services/api.ts';
import { useWebSocket } from '../hooks/useWebSocket.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface Customer {
  user_id: number;
  email: string;
  enterprise_name: string;
  is_admin: boolean;
  is_active: boolean;
  is_online: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

const CustomerManagement: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    enterprise_name: '',
    starlink_client_id: '',
    starlink_client_secret: '',
  });
  const [creating, setCreating] = useState(false);
  
  // WebSocket state
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [wsEnabled, setWsEnabled] = useState(true);
  
  // Initialize WebSocket connection
  const { isConnected, lastMessage } = useWebSocket(
    user.userId,
    wsToken,
    wsEnabled && user.role === 'admin'
  );

  useEffect(() => {
    fetchCustomers();
    initializeWebSocket();
  }, []);

  // Initialize WebSocket token
  const initializeWebSocket = async () => {
    try {
      const response = await getWebSocketToken();
      setWsToken(response.token);
      console.log('✅ WebSocket token obtained');
    } catch (error) {
      console.error('Failed to get WebSocket token:', error);
    }
  };

  // Handle WebSocket messages (real-time status updates)
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'user_status_change') {
      console.log('🔄 Real-time status update received:', lastMessage);
      
      // Update the customer in the list silently (no alert notification)
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.user_id === lastMessage.user_id
            ? { ...customer, is_online: lastMessage.is_online || false }
            : customer
        )
      );
    }
  }, [lastMessage]);

  // Refresh customer list when WebSocket connects (ensures fresh status on admin login)
  useEffect(() => {
    if (isConnected) {
      console.log('🔄 WebSocket connected, refreshing customer list for accurate status...');
      fetchCustomers();
    }
  }, [isConnected]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listUsers();
      // Filter to show only customers (non-admins)
      const customerList = response.users.filter((user: any) => !user.is_admin);
      setCustomers(customerList);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch customers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: number, customerEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customerEmail}"? This will remove them from both the database and Key Vault.`)) {
      return;
    }

    setDeletingCustomerId(customerId);
    setMessage(null);

    try {
      await deleteUser(customerId);
      setMessage({ type: 'success', text: `Customer ${customerEmail} deleted successfully` });
      // Refresh the customer list
      fetchCustomers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete customer';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const getStatusBadge = (customer: Customer) => {
    let status = '';
    let dotColor = '';

    if (!customer.is_active && !customer.last_login_at) {
      status = 'Unactivated';
      dotColor = 'bg-gray-600';
    } else if (customer.is_online) {
      status = 'Active';
      dotColor = 'bg-green-600';
    } else {
      status = 'Inactive';
      dotColor = 'bg-yellow-600';
    }

    return (
      <span className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        {status}
      </span>
    );
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const response = await createCustomer(formData);
      setMessage({ type: 'success', text: response.message });
      // Reset form and close modal
      setFormData({
        email: '',
        enterprise_name: '',
        starlink_client_id: '',
        starlink_client_secret: '',
      });
      setShowModal(false);
      // Refresh the customer list
      fetchCustomers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create customer';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl text-starlink-text">Loading customers...</h2>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-starlink-text">Customer Management</h2>
        <div className="flex items-center gap-4">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-starlink-light border border-starlink-border">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-starlink-text-secondary">
              {isConnected ? 'Live Updates' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-3 px-6 text-base"
          >
            Create Customer
          </button>
        </div>
      </div>
      
      <p className="text-starlink-text-secondary mb-8">
        Manage all customers in the system. Customers are created without passwords and must set their password on first login.
      </p>

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

      {error && (
        <div className="p-4 mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded">
          Error: {error}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-starlink-text-secondary text-lg">No customers found. Click "Create Customer" to add your first customer.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-starlink-light border-b-2 border-starlink-border">
                  <th className="p-3 md:p-4 text-left text-starlink-text font-semibold text-sm md:text-base">Email</th>
                  <th className="p-3 md:p-4 text-left text-starlink-text font-semibold text-sm md:text-base">Enterprise</th>
                  <th className="p-3 md:p-4 text-left text-starlink-text font-semibold text-sm md:text-base">Status</th>
                  <th className="p-3 md:p-4 text-left text-starlink-text font-semibold text-sm md:text-base hidden md:table-cell">Created</th>
                  <th className="p-3 md:p-4 text-center text-starlink-text font-semibold text-sm md:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
              {customers.map((customer) => (
                <tr key={customer.user_id} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                  <td className="p-4 text-starlink-text">{customer.email}</td>
                  <td className="p-4 text-starlink-text">{customer.enterprise_name}</td>
                  <td className="p-4">
                    {getStatusBadge(customer)}
                  </td>
                  <td className="p-4 text-starlink-text">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteCustomer(customer.user_id, customer.email)}
                      disabled={deletingCustomerId === customer.user_id}
                      className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingCustomerId === customer.user_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={fetchCustomers}
          className="btn-primary py-3 px-6 text-base"
        >
          Refresh List
        </button>
      </div>

      {/* Create Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-starlink-gray rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-starlink-text">Create New Customer</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-starlink-text hover:text-starlink-text-secondary text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-starlink-text">
                  Email:
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  required
                  className="input-field"
                />
              </div>

              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> No password is required. The customer will set their password on first login.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 border border-starlink-border text-starlink-text rounded hover:bg-starlink-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary py-3 text-base disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
