import React, { useState, useEffect } from 'react';
import { getTlsConfigs } from '../services/api.ts';
import { FaShieldAlt, FaCheck, FaTimes } from 'react-icons/fa';

interface TlsConfig {
  configId?: string;
  name?: string;
  enabled?: boolean;
  protocol?: string;
  certificateName?: string;
  expiryDate?: string;
  [key: string]: any;
}

const TlsConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<TlsConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTlsConfigs();
      if (response?.content?.results) {
        setConfigs(response.content.results);
      } else if (response?.content) {
        setConfigs(Array.isArray(response.content) ? response.content : [response.content]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch TLS configurations');
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
          <p className="text-starlink-text-secondary">Loading TLS configurations...</p>
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
          <button onClick={fetchConfigs} className="btn-primary">
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
            <FaShieldAlt className="text-starlink-accent" />
            TLS Configurations
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            View and manage TLS/SSL configurations for routers
          </p>
        </div>

        {/* Configs List */}
        <div className="card p-4 md:p-6">
          {configs.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="p-3 bg-starlink-light rounded border border-starlink-border mb-4">
                <p className="text-sm text-starlink-text">
                  Found <span className="font-semibold">{configs.length}</span> TLS configuration(s)
                </p>
              </div>

              {/* Configs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config, index) => (
                  <div
                    key={config.configId || index}
                    className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2 flex-1">
                        <FaShieldAlt className="text-starlink-accent text-lg mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-starlink-text">
                            {config.name || 'Unnamed Config'}
                          </h3>
                          {config.configId && (
                            <p className="text-[10px] text-starlink-text-secondary font-mono truncate">
                              {config.configId}
                            </p>
                          )}
                        </div>
                      </div>
                      {config.enabled !== undefined && (
                        <span className={`text-lg ${config.enabled ? 'text-green-500' : 'text-gray-500'}`}>
                          {config.enabled ? <FaCheck /> : <FaTimes />}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {config.protocol && (
                        <div>
                          <p className="text-starlink-text-secondary">Protocol</p>
                          <p className="text-starlink-text font-mono">{config.protocol}</p>
                        </div>
                      )}

                      {config.certificateName && (
                        <div>
                          <p className="text-starlink-text-secondary">Certificate</p>
                          <p className="text-starlink-text">{config.certificateName}</p>
                        </div>
                      )}

                      {config.expiryDate && (
                        <div>
                          <p className="text-starlink-text-secondary">Expiry Date</p>
                          <p className="text-starlink-text">{formatDate(config.expiryDate)}</p>
                        </div>
                      )}

                      {/* Display other fields */}
                      {Object.keys(config)
                        .filter(key => !['configId', 'name', 'enabled', 'protocol', 'certificateName', 'expiryDate'].includes(key))
                        .slice(0, 2)
                        .map(key => (
                          <div key={key}>
                            <p className="text-starlink-text-secondary">{key}</p>
                            <p className="text-starlink-text font-mono truncate">
                              {typeof config[key] === 'object' ? JSON.stringify(config[key]) : String(config[key])}
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
              <FaShieldAlt className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary">
                No TLS configurations found.
              </p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button onClick={fetchConfigs} className="btn-primary py-2 px-4">
            Refresh Configurations
          </button>
        </div>
      </div>
    </div>
  );
};

export default TlsConfigs;
