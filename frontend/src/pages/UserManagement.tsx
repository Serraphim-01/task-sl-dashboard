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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading users...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>User Management</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Manage all users in the system. Deleting a user removes them from both the database and Azure Key Vault.
      </p>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
          }}
        >
          Error: {error}
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No users found. Create your first customer from the "Manage Customers" page.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Enterprise</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{user.user_id}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>{user.enterprise_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: user.is_admin ? '#007bff' : '#28a745',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {user.is_admin ? 'ADMIN' : 'CUSTOMER'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(user.user_id, user.email)}
                      disabled={deletingUserId === user.user_id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: deletingUserId === user.user_id ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: deletingUserId === user.user_id ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                      }}
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

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={fetchUsers}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Refresh List
        </button>
      </div>
    </div>
  );
};

export default UserManagement;
