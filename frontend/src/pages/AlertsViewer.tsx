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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Loading alerts...</h2></div>;

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>Error: {error}</div>
        <button onClick={fetchAlerts} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>🔔 Alerts ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#28a745' }}>✅ No active alerts - All systems operational!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {alerts.map((alert: any, index: number) => (
            <div key={alert.id || index} style={{
              backgroundColor: alert.severity === 'critical' ? '#f8d7da' : alert.severity === 'warning' ? '#fff3cd' : 'white',
              padding: '20px',
              borderRadius: '8px',
              borderLeft: `4px solid ${alert.severity === 'critical' ? '#dc3545' : alert.severity === 'warning' ? '#ffc107' : '#17a2b8'}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{alert.title || alert.message || 'Alert'}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: alert.severity === 'critical' ? '#dc3545' : alert.severity === 'warning' ? '#ffc107' : '#17a2b8',
                  color: alert.severity === 'warning' ? '#000' : '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>{alert.severity || 'info'}</span>
              </div>
              <p style={{ margin: '10px 0', color: '#6c757d' }}>{alert.description || alert.details || 'No additional details'}</p>
              <small style={{ color: '#adb5bd' }}>
                Created: {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
              </small>
            </div>
          ))}
        </div>
      )}
      <button onClick={fetchAlerts} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>Refresh</button>
    </div>
  );
};

export default AlertsViewer;
