import React, { useState, useEffect } from 'react';
import { getAccountInfo, getAccountUsers } from '../services/api.ts';

const AccountInfo: React.FC = () => {
  const [accountData, setAccountData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountResponse, usersResponse] = await Promise.all([
        getAccountInfo(),
        getAccountUsers().catch(() => ({ users: [] })), // Handle if endpoint not available
      ]);
      setAccountData(accountResponse);
      setUsers(usersResponse.users || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch account information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Loading account information...</h2></div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          Error: {error}
        </div>
        <button onClick={fetchData} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>👤 Account Information</h2>

      {/* Account Details */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Account Details</h3>
        {accountData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {Object.entries(accountData).map(([key, value]) => (
              <div key={key} style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong style={{ color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>{key}</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '16px' }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No account data available</p>
        )}
      </div>

      {/* Account Users */}
      {users.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Account Users ({users.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{user.id || user.userId || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.email || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.role || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: user.status === 'active' ? '#28a745' : '#6c757d',
                        color: 'white',
                        fontSize: '12px',
                      }}>
                        {user.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={fetchData}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Refresh Data
      </button>
    </div>
  );
};

export default AccountInfo;
