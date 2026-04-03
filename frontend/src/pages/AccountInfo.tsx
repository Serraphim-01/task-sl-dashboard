import React from 'react';
import KmsTestButton from '../components/KmsTestButton.tsx';
import DbTestButton from '../components/DbTestButton.tsx';

const AccountInfo: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Account Information</h1>
      <p>Coming soon - Read &amp; Edit permissions.</p>
      <KmsTestButton />
      <DbTestButton />
    </div>
  );
};

export default AccountInfo;

