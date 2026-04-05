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
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Network Configuration</h2>

      <div className="card mb-5">
        <label className="block mb-3 font-medium text-starlink-text">Select Device:</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="input-field"
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
          className="btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Load Configuration'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded mb-5">
          Error: {error}
        </div>
      )}

      {config && (
        <div className="card">
          <h3 className="mt-0 text-xl font-semibold text-starlink-text mb-4">Network Configuration</h3>
          <pre className="bg-starlink-light p-5 rounded overflow-auto max-h-[600px] text-sm leading-relaxed text-starlink-text">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NetworkConfig;
