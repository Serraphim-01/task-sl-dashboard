import React, { useState, useEffect } from 'react';
import { getAccountDetails } from '../services/api.ts';

interface AccountContent {
  accountNumber?: string;
  regionCode?: string;
  accountName?: string;
  activeSuspensions?: any[];
}

interface AccountData {
  content?: AccountContent;
  errors?: any[];
  warnings?: any[];
  information?: any[];
  isValid?: boolean;
}

const AccountInfo: React.FC = () => {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await getAccountDetails();
        setAccount(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load account information');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Account Information</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Account Information</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  if (!account || !account.content) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Account Information</h2>
        <p>No account data available.</p>
      </div>
    );
  }

  const content = account.content;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Starlink Account Information</h2>
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '600px',
        marginTop: '1rem',
      }}>
        <p><strong>Account ID:</strong> {content.accountNumber || '—'}</p>
        <p><strong>Account Name:</strong> {content.accountName || '—'}</p>
        <p><strong>Region Code:</strong> {content.regionCode || '—'}</p>
        <p><strong>Active Suspensions:</strong> {content.activeSuspensions?.length || 0}</p>
        {account.isValid !== undefined && (
          <p><strong>Account Status:</strong> {account.isValid ? 'Valid' : 'Invalid'}</p>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
