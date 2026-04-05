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
    return <div className="p-10 text-center"><h2 className="text-xl text-starlink-text">Loading account information...</h2></div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">
          Error: {error}
        </div>
        <button onClick={fetchData} className="mt-5 btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">👤 Account Information</h2>

      {/* Account Details */}
      <div className="card mb-5">
        <h3 className="mt-0 text-xl font-semibold text-starlink-text mb-4">Account Details</h3>
        {accountData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(accountData).map(([key, value]) => (
              <div key={key} className="p-3 bg-starlink-light rounded border border-starlink-border">
                <strong className="text-starlink-text-muted text-xs uppercase">{key}</strong>
                <p className="mt-1 text-base text-starlink-text">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-starlink-text-secondary">No account data available</p>
        )}
      </div>

      {/* Account Users */}
      {users.length > 0 && (
        <div className="card">
          <h3 className="mt-0 text-xl font-semibold text-starlink-text mb-4">Account Users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-starlink-light border-b-2 border-starlink-border">
                  <th className="p-3 text-left text-starlink-text">User ID</th>
                  <th className="p-3 text-left text-starlink-text">Email</th>
                  <th className="p-3 text-left text-starlink-text">Role</th>
                  <th className="p-3 text-left text-starlink-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any, index: number) => (
                  <tr key={index} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                    <td className="p-3 text-starlink-text">{user.id || user.userId || 'N/A'}</td>
                    <td className="p-3 text-starlink-text">{user.email || 'N/A'}</td>
                    <td className="p-3 text-starlink-text">{user.role || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'active' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
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
        className="btn-primary mt-5"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default AccountInfo;
