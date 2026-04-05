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
    return <div className="p-10 text-center"><h2 className="text-xl text-starlink-text">Loading devices...</h2></div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">
          Error: {error}
        </div>
        <button onClick={fetchDevices} className="mt-5 btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Devices ({devices.length})</h2>

      {devices.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-starlink-text-secondary text-lg">No devices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((device: any, index: number) => (
            <div key={device.id || index} className="card">
              <h3 className="mt-0 text-lg font-semibold text-starlink-text mb-3">
                {device.name || device.id || `Device ${index + 1}`}
              </h3>
              <div className="space-y-2">
                {Object.entries(device).slice(0, 6).map(([key, value]) => (
                  <div key={key}>
                    <strong className="text-xs text-starlink-text-muted uppercase block">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </strong>
                    <p className="text-sm text-starlink-text mt-1">
                      {typeof value === 'object' && value !== null
                        ? Array.isArray(value)
                          ? `${value.length} item(s)`
                          : JSON.stringify(value).substring(0, 50) + '...'
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={fetchDevices} className="btn-primary mt-5">
        Refresh
      </button>
    </div>
  );
};

export default DeviceList;
