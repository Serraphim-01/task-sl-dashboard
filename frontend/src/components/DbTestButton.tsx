import React, { useState } from 'react';
import api from '../services/api';

const DbTestButton: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const response = await api.get('/health/db');
      setStatus(`✅ DB successful! ${response.data.message}`);
      console.log('DB test response:', response.data);
    } catch (err: any) {
      setError(`❌ DB test failed: ${err.response?.data?.detail || err.message}`);
      console.error('DB error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1rem' }}>
      <button
        onClick={testConnection}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Testing DB...' : 'Test Database Connection'}
      </button>
      {status && (
        <div style={{ marginTop: '1rem', color: '#2e7d32', fontSize: '0.9rem' }}>
          {status}
        </div>
      )}
      {error && (
        <div style={{ marginTop: '1rem', color: '#c62828', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DbTestButton;

