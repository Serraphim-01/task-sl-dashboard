import React, { useState, useEffect } from 'react';
import { getSandboxClients } from '../services/api.ts';
import { FaUsers, FaDesktop } from 'react-icons/fa';

interface SandboxClient {
  clientId?: string;
  name?: string;
  status?: string;
  createdDate?: string;
  [key: string]: any;
}

const SandboxClients: React.FC = () => {
  const [clients, setClients] = useState<SandboxClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSandboxClients();
      if (response?.content?.results) {
        setClients(response.content.results);
      } else if (response?.content) {
        setClients(Array.isArray(response.content) ? response.content : [response.content]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch sandbox clients');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-starlink-text-secondary">Loading sandbox clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="card p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-starlink-text mb-2">Error</h2>
          <p className="text-sm text-starlink-text-secondary mb-4">{error}</p>
          <button onClick={fetchClients} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-starlink-darker p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-starlink-text flex items-center gap-3">
            <FaDesktop className="text-starlink-accent" />
            Sandbox Clients
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            View all sandbox client configurations for testing
          </p>
        </div>

        {/* Clients List */}
        <div className="card p-4 md:p-6">
          {clients.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="p-3 bg-starlink-light rounded border border-starlink-border mb-4">
                <p className="text-sm text-starlink-text">
                  Found <span className="font-semibold">{clients.length}</span> sandbox client(s)
                </p>
              </div>

              {/* Clients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client, index) => (
                  <div
                    key={client.clientId || index}
                    className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <FaUsers className="text-starlink-accent text-lg mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-starlink-text">
                          {client.name || 'Unnamed Client'}
                        </h3>
                        {client.clientId && (
                          <p className="text-[10px] text-starlink-text-secondary font-mono truncate">
                            {client.clientId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {client.status && (
                        <div>
                          <p className="text-starlink-text-secondary">Status</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] ${
                            client.status === 'active' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                      )}

                      {client.createdDate && (
                        <div>
                          <p className="text-starlink-text-secondary">Created</p>
                          <p className="text-starlink-text">{formatDate(client.createdDate)}</p>
                        </div>
                      )}

                      {/* Display other fields */}
                      {Object.keys(client)
                        .filter(key => !['clientId', 'name', 'status', 'createdDate'].includes(key))
                        .slice(0, 3)
                        .map(key => (
                          <div key={key}>
                            <p className="text-starlink-text-secondary">{key}</p>
                            <p className="text-starlink-text font-mono truncate">
                              {typeof client[key] === 'object' ? JSON.stringify(client[key]) : String(client[key])}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
              <FaDesktop className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary">
                No sandbox clients found.
              </p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button onClick={fetchClients} className="btn-primary py-2 px-4">
            Refresh Clients
          </button>
        </div>
      </div>
    </div>
  );
};

export default SandboxClients;
