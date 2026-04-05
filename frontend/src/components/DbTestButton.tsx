import React, { useState } from 'react';
import api from '../services/api.ts';

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
      setStatus(`DB successful! ${response.data.message}`);
      console.log('DB test response:', response.data);
    } catch (err: any) {
      setError(`DB test failed: ${err.response?.data?.detail || err.message}`);
      console.error('DB error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4">
      <button
        onClick={testConnection}
        disabled={loading}
        className="w-full py-3 bg-starlink-light text-starlink-text border-none rounded font-bold cursor-pointer hover:bg-starlink-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing DB...' : 'Test Database Connection'}
      </button>
      {status && (
        <div className="mt-4 text-green-600 text-sm">
          {status}
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DbTestButton;

