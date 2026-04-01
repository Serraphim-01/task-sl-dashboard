import React, { useState } from 'react';
import api from '../services/api';

const KmsTestButton: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const response = await api.get('/auth/test-connection');
      setStatus('✅ Connection successful! Starlink account data received.');
      console.log(response.data);
    } catch (err: any) {
      setError(`❌ Connection failed: ${err.message}`);
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
        {loading ? 'Testing...' : 'Test KMS Connection'}
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

export default KmsTestButton;
