import React, { useState, useEffect } from 'react';
import { getAlerts } from '../services/api.ts';

const AlertsViewer: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAlerts();
      setAlerts(response.alerts || response.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><h2 className="text-xl text-starlink-text">Loading alerts...</h2></div>;

  if (error) {
    return (
      <div className="p-10">
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">Error: {error}</div>
        <button onClick={fetchAlerts} className="mt-5 btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Alerts ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-lg text-green-500">No active alerts - All systems operational!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any, index: number) => (
            <div key={alert.id || index} className={`p-5 rounded border-l-4 shadow-starlink ${
              alert.severity === 'critical' ? 'bg-red-900/50 border-red-600' : 
              alert.severity === 'warning' ? 'bg-yellow-900/30 border-yellow-500' : 
              'bg-starlink-gray border-blue-500'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="m-0 text-lg font-semibold text-starlink-text">{alert.title || alert.message || 'Alert'}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  alert.severity === 'critical' ? 'bg-red-600 text-white' : 
                  alert.severity === 'warning' ? 'bg-yellow-500 text-black' : 
                  'bg-blue-500 text-white'
                }`}>{alert.severity || 'info'}</span>
              </div>
              <p className="my-3 text-starlink-text-secondary">{alert.description || alert.details || 'No additional details'}</p>
              <small className="text-starlink-text-muted">
                Created: {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
              </small>
            </div>
          ))}
        </div>
      )}
      <button onClick={fetchAlerts} className="btn-primary mt-5">Refresh</button>
    </div>
  );
};

export default AlertsViewer;
