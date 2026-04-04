import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerAccount, getCustomerTelemetry } from '../services/api.ts';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [accountData, setAccountData] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch account info
      const account = await getCustomerAccount();
      setAccountData(account);

      // Fetch telemetry data
      const telemetry = await getCustomerTelemetry();
      setTelemetryData(telemetry);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Unauthorized - redirect to login
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to fetch data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div
          style={{
            padding: '15px',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            marginBottom: '20px',
          }}
        >
          Error: {error}
        </div>
        <button onClick={fetchData} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <h2>Customer Dashboard</h2>

      {/* Account Information */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Account Information</h3>
        {accountData ? (
          <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(accountData, null, 2)}
          </pre>
        ) : (
          <p>No account data available</p>
        )}
      </div>

      {/* Telemetry Data */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Telemetry Data</h3>
        {telemetryData ? (
          <pre style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(telemetryData, null, 2)}
          </pre>
        ) : (
          <p>No telemetry data available</p>
        )}
      </div>

      <button
        onClick={fetchData}
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
        Refresh Data
      </button>
    </div>
  );
};

export default CustomerDashboard;
