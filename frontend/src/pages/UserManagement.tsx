import React, { useState, useEffect } from 'react';
import { listUsers, deleteUser } from '../services/api.ts';

interface User {
  user_id: number;
  email: string;
  enterprise_name: string;
  is_admin: boolean;
  created_at: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listUsers();
      setUsers(response.users);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This will remove them from both the database and Key Vault.`)) {
      return;
    }

    setDeletingUserId(userId);
    setMessage(null);

    try {
      await deleteUser(userId);
      setMessage({ type: 'success', text: `User ${userEmail} deleted successfully` });
      // Refresh the user list
      fetchUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete user';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl text-starlink-text">Loading users...</h2>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-starlink-text">User Management</h2>
      <p className="text-starlink-text-secondary mb-8">
        Manage all users in the system. Deleting a user removes them from both the database and Azure Key Vault.
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

      {users.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-starlink-text-secondary text-lg">No users found. Create your first customer from the "Manage Customers" page.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-starlink-light border-b-2 border-starlink-border">
                <th className="p-4 text-left text-starlink-text font-semibold">ID</th>
                <th className="p-4 text-left text-starlink-text font-semibold">Email</th>
                <th className="p-4 text-left text-starlink-text font-semibold">Enterprise</th>
                <th className="p-4 text-left text-starlink-text font-semibold">Role</th>
                <th className="p-4 text-left text-starlink-text font-semibold">Created</th>
                <th className="p-4 text-center text-starlink-text font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                  <td className="p-4 text-starlink-text">{user.user_id}</td>
                  <td className="p-4 text-starlink-text">{user.email}</td>
                  <td className="p-4 text-starlink-text">{user.enterprise_name}</td>
                  <td className="p-4">
                    <span className="btn-primary py-1 px-3 text-xs inline-block">
                      {user.is_admin ? 'ADMIN' : 'CUSTOMER'}
                    </span>
                  </td>
                  <td className="p-4 text-starlink-text">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.user_id, user.email)}
                      disabled={deletingUserId === user.user_id}
                      className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingUserId === user.user_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={fetchUsers}
          className="btn-primary py-3 px-6 text-base"
        >
          Refresh List
        </button>
      </div>
    </div>
  );
};

export default UserManagement;
