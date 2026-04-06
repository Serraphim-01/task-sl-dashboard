import React, { useState } from 'react';
import api from '../services/api.ts';

const KmsTestButton: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const response = await api.get('/auth/kms-test');
      setStatus(`KMS successful! Secrets loaded. Vault logs in backend terminal.`);
    } catch (err: any) {
      setError(`KMS test failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4">
      <button
        onClick={testConnection}
        disabled={loading}
        className="w-full py-3 bg-starlink-dark text-white border border-gray-400 font-bold cursor-pointer hover:bg-starlink-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
      >
        {loading ? 'Testing...' : 'Test KMS Connection'}
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

export default KmsTestButton;
