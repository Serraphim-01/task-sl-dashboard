import React, { useState } from 'react';
import { listDevices, getNetworkConfig } from '../services/api.ts';

const NetworkConfig: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await listDevices();
      const deviceList = response.devices || response.items || [];
      setDevices(deviceList);
      if (deviceList.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceList[0].id);
      }
    } catch (err: any) {
      setError('Failed to fetch devices');
    }
  };

  const fetchConfig = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getNetworkConfig(selectedDevice);
      setConfig(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch network config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>🌐 Network Configuration</h2>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Device:</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        >
          {devices.map((device: any) => (
            <option key={device.id} value={device.id}>
              {device.name || device.id}
            </option>
          ))}
        </select>
        <button
          onClick={fetchConfig}
          disabled={!selectedDevice || loading}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: !selectedDevice || loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !selectedDevice || loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Loading...' : 'Load Configuration'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {config && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Network Configuration</h3>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '600px',
            fontSize: '14px',
            lineHeight: '1.6',
          }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NetworkConfig;
