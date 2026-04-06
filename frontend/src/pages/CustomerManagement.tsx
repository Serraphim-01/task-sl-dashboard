import React, { useState, useEffect } from 'react';
import { listUsers, deleteUser, createCustomer, getWebSocketToken } from '../services/api.ts';
import { useWebSocket } from '../hooks/useWebSocket.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FaTrash } from 'react-icons/fa';

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
    } catch (error) {
      // Silently fail - will retry on next connection
    }
  };

  // Handle WebSocket messages (real-time status updates)
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'user_status_change') {
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

  const getStatusBadge = (customer: Customer, showText: boolean = true) => {
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

    if (showText) {
      return (
        <span className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
          {status}
        </span>
      );
    } else {
      // Mobile: Just the dot
      return (
        <span className={`w-3 h-3 rounded-full ${dotColor} inline-block`} title={status}></span>
      );
    }
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
      <div className="p-6 text-center">
        <h2 className="text-lg text-starlink-text">Loading customers...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl md:text-3xl font-bold text-starlink-text">Customer Management</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-starlink-light border border-starlink-border">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-starlink-text-secondary">
              {isConnected ? 'Live Updates' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-2 px-4 text-sm flex-1 sm:flex-none"
          >
            Create Customer
          </button>
        </div>
      </div>
      
      <p className="text-starlink-text-secondary mb-4 md:mb-8 text-sm md:text-base">
        Manage all customers in the system. Customers are created without passwords and must set their password on first login.
      </p>

      {message && (
        <div
          className={`p-3 mb-4 rounded border text-sm ${
            message.type === 'success' 
              ? 'bg-green-900/50 border-green-700 text-green-200' 
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">
          Error: {error}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="card text-center py-6">
          <p className="text-starlink-text-secondary text-sm md:text-base">No customers found. Click "Create Customer" to add your first customer.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {customers.map((customer) => (
              <div key={customer.user_id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status Dot */}
                    {getStatusBadge(customer, false)}
                    
                    {/* Email and Enterprise */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-starlink-text font-medium truncate">{customer.email}</p>
                      <p className="text-xs text-starlink-text-secondary truncate">{customer.enterprise_name}</p>
                    </div>
                  </div>
                  
                  {/* Delete Icon */}
                  <button
                    onClick={() => handleDeleteCustomer(customer.user_id, customer.email)}
                    disabled={deletingCustomerId === customer.user_id}
                    className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed p-2 flex-shrink-0"
                    title="Delete Customer"
                  >
                    <FaTrash className="text-base" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-starlink-light border-b-2 border-starlink-border">
                    <th className="p-2 md:p-3 text-left text-starlink-text font-semibold text-xs md:text-sm">Email</th>
                    <th className="p-2 md:p-3 text-left text-starlink-text font-semibold text-xs md:text-sm">Enterprise</th>
                    <th className="p-2 md:p-3 text-left text-starlink-text font-semibold text-xs md:text-sm">Status</th>
                    <th className="p-2 md:p-3 text-left text-starlink-text font-semibold text-xs md:text-sm hidden lg:table-cell">Created</th>
                    <th className="p-2 md:p-3 text-center text-starlink-text font-semibold text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                {customers.map((customer) => (
                  <tr key={customer.user_id} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm">{customer.email}</td>
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm">{customer.enterprise_name}</td>
                    <td className="p-2 md:p-3">
                      {getStatusBadge(customer, true)}
                    </td>
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm hidden lg:table-cell">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <button
                        onClick={() => handleDeleteCustomer(customer.user_id, customer.email)}
                        disabled={deletingCustomerId === customer.user_id}
                        className="btn-primary py-1.5 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
        </>
      )}

      <div className="mt-4 md:mt-8 text-center">
        <button
          onClick={fetchCustomers}
          className="btn-primary py-2 px-4 text-sm md:text-base"
        >
          Refresh List
        </button>
      </div>

      {/* Create Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-starlink-gray rounded-lg p-4 md:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-starlink-text">Create New Customer</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-starlink-text hover:text-starlink-text-secondary text-xl md:text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 md:space-y-6">
              <div>
                <label className="block mb-1.5 md:mb-2 font-semibold text-starlink-text text-sm md:text-base">
                  Email:
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 md:mb-2 font-semibold text-starlink-text text-sm md:text-base">
                  Enterprise Name:
                </label>
                <input
                  type="text"
                  name="enterprise_name"
                  value={formData.enterprise_name}
                  onChange={handleFormChange}
                  required
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 md:mb-2 font-semibold text-starlink-text text-sm md:text-base">
                  Starlink Client ID:
                </label>
                <input
                  type="text"
                  name="starlink_client_id"
                  value={formData.starlink_client_id}
                  onChange={handleFormChange}
                  required
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 md:mb-2 font-semibold text-starlink-text text-sm md:text-base">
                  Starlink Client Secret:
                </label>
                <input
                  type="password"
                  name="starlink_client_secret"
                  value={formData.starlink_client_secret}
                  onChange={handleFormChange}
                  required
                  className="input-field text-sm"
                />
              </div>

              <div className="bg-blue-900/30 border border-blue-700 p-3 rounded">
                <p className="text-blue-200 text-xs md:text-sm">
                  <strong>Note:</strong> No password is required. The customer will set their password on first login.
                </p>
              </div>

              <div className="flex gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 border border-starlink-border text-starlink-text rounded hover:bg-starlink-light transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50"
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
