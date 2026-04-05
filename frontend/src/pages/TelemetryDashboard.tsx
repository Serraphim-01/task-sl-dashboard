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
    return <div className="p-10 text-center"><h2 className="text-xl text-starlink-text">Loading telemetry...</h2></div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">
          Error: {error}
        </div>
        <button onClick={fetchTelemetry} className="mt-5 btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Real-Time Telemetry</h2>

      <div className="card">
        {telemetry ? (
          // Check if it's a message response (no data available)
          telemetry.message ? (
            <div className="text-center py-10">
              <p className="text-starlink-text-secondary text-lg">{telemetry.message}</p>
              <p className="text-starlink-text-muted mt-2 text-sm">
                Telemetry data will appear here once your Starlink devices start transmitting data.
              </p>
            </div>
          ) : (
            // Display actual telemetry data
            <pre className="bg-starlink-light p-5 rounded overflow-auto max-h-[600px] text-sm leading-relaxed text-starlink-text">
              {JSON.stringify(telemetry, null, 2)}
            </pre>
          )
        ) : (
          <p className="text-starlink-text-secondary">No telemetry data available</p>
        )}
      </div>

      <button onClick={fetchTelemetry} className="btn-primary mt-5">
        Refresh Data
      </button>
    </div>
  );
};

export default TelemetryDashboard;
