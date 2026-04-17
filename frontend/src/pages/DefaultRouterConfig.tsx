import React, { useState, useEffect } from 'react';
import { getDefaultRouterConfig } from '../services/api.ts';
import { FaRoute, FaDownload } from 'react-icons/fa';

interface RouterConfig {
  configId: string;
  nickname?: string;
  routerConfigJson?: string;
  [key: string]: any;
}

const DefaultRouterConfig: React.FC = () => {
  const [config, setConfig] = useState<RouterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDefaultConfig();
  }, []);

  const fetchDefaultConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDefaultRouterConfig();
      console.log('Default Router Config API Response:', response);
      if (response?.content) {
        setConfig(response.content);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch default router config');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-starlink-text-secondary">Loading default router config...</p>
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
          <button onClick={fetchDefaultConfig} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-starlink-darker p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-starlink-text flex items-center gap-3">
            <FaRoute className="text-starlink-accent" />
            Default Router Configuration
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            This is the default configuration that will be assigned to new routers when first added
          </p>
        </div>

        {/* Config Details */}
        {config && (
          <div className="card p-4 md:p-6">
            <div className="space-y-4">
              {config.configId && (
                <div>
                  <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Config ID</p>
                  <p className="text-sm text-starlink-text font-mono break-all">{config.configId}</p>
                </div>
              )}

              {config.nickname && (
                <div>
                  <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Nickname</p>
                  <p className="text-sm text-starlink-text">{config.nickname}</p>
                </div>
              )}

              {config.routerConfigJson && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase">Router Configuration JSON</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(config.routerConfigJson || '');
                      }}
                      className="text-xs text-starlink-accent hover:underline flex items-center gap-1"
                    >
                      <FaDownload />
                      Copy JSON
                    </button>
                  </div>
                  <pre className="text-xs text-starlink-text-secondary bg-starlink-gray p-4 rounded overflow-x-auto border border-starlink-border">
                    {JSON.stringify(JSON.parse(config.routerConfigJson), null, 2)}
                  </pre>
                </div>
              )}

              {/* Display any other fields in config */}
              {Object.keys(config)
                .filter(key => !['configId', 'nickname', 'routerConfigJson'].includes(key))
                .map(key => (
                  <div key={key}>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">{key}</p>
                    <p className="text-sm text-starlink-text">
                      {typeof config[key] === 'object' ? JSON.stringify(config[key], null, 2) : String(config[key])}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!config && (
          <div className="card p-6 text-center">
            <FaRoute className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
            <p className="text-sm text-starlink-text-secondary">
              No default router configuration found.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button onClick={fetchDefaultConfig} className="btn-primary py-2 px-4">
            Refresh Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaultRouterConfig;
