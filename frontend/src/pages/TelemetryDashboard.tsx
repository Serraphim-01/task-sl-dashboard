import React, { useState, useEffect } from 'react';
import { getTelemetry } from '../services/api.ts';

const TelemetryDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTelemetry();
      setTelemetry(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch telemetry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Loading telemetry...</h2></div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          Error: {error}
        </div>
        <button onClick={fetchTelemetry} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>📊 Real-Time Telemetry</h2>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {telemetry ? (
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '4px', 
            overflow: 'auto',
            maxHeight: '600px',
            fontSize: '14px',
            lineHeight: '1.6',
          }}>
            {JSON.stringify(telemetry, null, 2)}
          </pre>
        ) : (
          <p>No telemetry data available</p>
        )}
      </div>

      <button onClick={fetchTelemetry} style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
      }}>
        Refresh Data
      </button>
    </div>
  );
};

export default TelemetryDashboard;
