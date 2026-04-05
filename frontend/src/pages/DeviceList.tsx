import React, { useState, useEffect } from 'react';
import { listDevices } from '../services/api.ts';

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listDevices();
      setDevices(response.devices || response.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Loading devices...</h2></div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          Error: {error}
        </div>
        <button onClick={fetchDevices} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>🛰️ Devices ({devices.length})</h2>

      {devices.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
          <p>No devices found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {devices.map((device: any, index: number) => (
            <div key={device.id || index} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{device.name || device.id || `Device ${index + 1}`}</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {Object.entries(device).slice(0, 6).map(([key, value]) => (
                  <div key={key}>
                    <strong style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>{key}:</strong>
                    <p style={{ margin: '5px 0 0 0' }}>
                      {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={fetchDevices} style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
      }}>
        Refresh
      </button>
    </div>
  );
};

export default DeviceList;
