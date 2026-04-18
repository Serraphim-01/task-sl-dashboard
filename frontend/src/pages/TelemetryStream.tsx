import React, { useState, useEffect, useRef } from 'react';
import { getTelemetryStream } from '../services/api.ts';
import { FaStream, FaPlay, FaStop, FaDownload, FaTrash } from 'react-icons/fa';

interface TelemetryRecord {
  DeviceType?: string;
  UtcTimestampNs?: number;
  DeviceId?: string;
  [key: string]: any;
}

interface ParsedTelemetryRecord {
  deviceType?: string;
  deviceId?: string;
  timestamp?: string;
  timestampNs?: number;
  [key: string]: any;
}

interface DeviceTelemetryData {
  deviceId: string;
  deviceType: string;
  lastUpdate?: string;
  latestRecord: ParsedTelemetryRecord;
  allRecords: ParsedTelemetryRecord[];
}

const TelemetryStream: React.FC = () => {
  const [deviceMap, setDeviceMap] = useState<{[key: string]: DeviceTelemetryData}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(100);
  const [maxLingerMs, setMaxLingerMs] = useState<number>(5000);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deviceIdFilter, setDeviceIdFilter] = useState<string>('');
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll removed - we're using cards now instead of scrolling log
  }, [Object.keys(deviceMap).length, isStreaming]);

  const fetchTelemetryBatch = async () => {
    setError(null);
    try {
      const response = await getTelemetryStream(batchSize, maxLingerMs);
      
      // Handle the compact telemetry format
      if (response?.data?.values && response?.data?.columnNamesByDeviceType) {
        const { values, columnNamesByDeviceType } = response.data;
        const updates: {[key: string]: DeviceTelemetryData} = {};
        
        // Parse each telemetry value array into a readable object
        for (const valueArray of values) {
          if (!Array.isArray(valueArray) || valueArray.length === 0) continue;
          
          const deviceType = valueArray[0]; // First element is device type
          const columnNames = columnNamesByDeviceType[deviceType];
          
          if (!columnNames) continue;
          
          // Map values to column names
          const record: ParsedTelemetryRecord = {};
          let deviceId = '';
          
          for (let i = 0; i < columnNames.length; i++) {
            const columnName = columnNames[i];
            const value = valueArray[i];
            
            if (columnName === 'DeviceType') {
              record.deviceType = getDeviceTypeLabel(value);
            } else if (columnName === 'UtcTimestampNs') {
              record.timestampNs = value;
              record.timestamp = nanosecondsToISOString(value);
            } else if (columnName === 'DeviceId') {
              record.deviceId = value;
              deviceId = value;
            } else {
              record[columnName] = value;
            }
          }
          
          if (deviceId) {
            if (!updates[deviceId]) {
              updates[deviceId] = {
                deviceId,
                deviceType: record.deviceType || 'Unknown',
                lastUpdate: record.timestamp,
                latestRecord: record,
                allRecords: [record]
              };
            } else {
              // Update existing device data - keep latest record
              updates[deviceId].latestRecord = record;
              updates[deviceId].lastUpdate = record.timestamp;
              updates[deviceId].allRecords.push(record);
            }
          }
        }
        
        // Merge with existing device map
        setDeviceMap(prev => {
          const merged = { ...prev };
          Object.keys(updates).forEach(deviceId => {
            if (merged[deviceId]) {
              // Update existing device
              merged[deviceId] = {
                ...merged[deviceId],
                latestRecord: updates[deviceId].latestRecord,
                lastUpdate: updates[deviceId].lastUpdate,
                allRecords: [...merged[deviceId].allRecords, ...updates[deviceId].allRecords]
              };
            } else {
              // Add new device
              merged[deviceId] = updates[deviceId];
            }
          });
          return merged;
        });
      }
    } catch (err: any) {
      console.error('Telemetry Stream Error:', err);
      setError(err.response?.data?.detail || 'Failed to fetch telemetry stream');
      stopStream();
    }
  };

  // Helper to convert device type enum to label
  const getDeviceTypeLabel = (typeCode: string): string => {
    const typeMap: { [key: string]: string } = {
      'u': 'User Terminal',
      'r': 'Router',
      'i': 'IP Allocation'
    };
    return typeMap[typeCode] || typeCode;
  };

  // Helper to convert nanosecond timestamp to ISO string
  const nanosecondsToISOString = (ns: number): string => {
    const ms = ns / 1000000;
    return new Date(ms).toISOString();
  };

  const startStream = () => {
    setIsStreaming(true);
    setDeviceMap({}); // Clear previous data
    fetchTelemetryBatch(); // Fetch first batch immediately
    
    // Set up periodic fetching
    streamIntervalRef.current = setInterval(() => {
      fetchTelemetryBatch();
    }, Math.max(maxLingerMs, 5000)); // At least 5 seconds between requests
  };

  const stopStream = () => {
    setIsStreaming(false);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  const clearData = () => {
    setDeviceMap({});
  };

  const exportData = () => {
    const dataStr = JSON.stringify(Object.values(deviceMap), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetry-stream-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredDevices = Object.values(deviceMap).filter(device => {
    if (!deviceIdFilter) return true;
    return device.deviceId.includes(deviceIdFilter) || 
           device.deviceType.toLowerCase().includes(deviceIdFilter.toLowerCase());
  });

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-starlink-text-secondary">Loading telemetry stream...</p>
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
            <FaStream className="text-starlink-accent" />
            Telemetry Stream
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            Real-time telemetry data stream from all devices. Filter by device ID to view specific device data.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="card p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-starlink-text mb-4">Stream Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-starlink-text-secondary mb-1.5">
                Batch Size (max 65000)
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                min={1}
                max={65000}
                className="input-field w-full text-sm"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-xs text-starlink-text-secondary mb-1.5">
                Max Linger Time (ms, max 65000)
              </label>
              <input
                type="number"
                value={maxLingerMs}
                onChange={(e) => setMaxLingerMs(parseInt(e.target.value) || 15000)}
                min={1000}
                max={65000}
                step={1000}
                className="input-field w-full text-sm"
                placeholder="15000"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-starlink-text-secondary mb-1.5">
              Filter by Device ID (optional)
            </label>
            <input
              type="text"
              value={deviceIdFilter}
              onChange={(e) => setDeviceIdFilter(e.target.value)}
              placeholder="Enter device ID to filter..."
              className="input-field w-full text-sm"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isStreaming ? (
              <button onClick={startStream} className="btn-primary flex items-center gap-2">
                <FaPlay />
                Start Stream
              </button>
            ) : (
              <button onClick={stopStream} className="btn-secondary flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <FaStop />
                Stop Stream
              </button>
            )}

            {Object.keys(deviceMap).length > 0 && (
              <>
                <button onClick={exportData} className="btn-secondary flex items-center gap-2">
                  <FaDownload />
                  Export ({filteredDevices.length} devices)
                </button>
                <button onClick={clearData} className="py-2 px-4 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors flex items-center gap-2">
                  <FaTrash />
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Stream Status */}
          <div className="mt-4 p-3 bg-starlink-light rounded border border-starlink-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-starlink-text-secondary">Status:</span>
              <span className={`font-semibold ${isStreaming ? 'text-green-500' : 'text-gray-500'}`}>
                {isStreaming ? '● Streaming' : '○ Stopped'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-starlink-text-secondary">Active Devices:</span>
              <span className="text-starlink-text font-mono">{Object.keys(deviceMap).length}</span>
            </div>
            {deviceIdFilter && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-starlink-text-secondary">Filtered Devices:</span>
                <span className="text-starlink-text font-mono">{filteredDevices.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">
            Error: {error}
          </div>
        )}

        {/* Telemetry Data Display */}
        <div className="card p-4 md:p-6">
          <h2 className="text-lg font-semibold text-starlink-text mb-4">
            Telemetry Data {isStreaming && <span className="text-sm text-green-500">(Live)</span>}
          </h2>

          {filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => (
                <div 
                  key={device.deviceId}
                  className="card p-4 bg-starlink-gray border border-starlink-border hover:border-starlink-accent/50 transition-all duration-200"
                >
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1">
                      {/* Device Type Icon */}
                      <div className={`p-2 rounded-lg ${
                        device.deviceType === 'User Terminal' ? 'bg-blue-600/20' :
                        device.deviceType === 'Router' ? 'bg-purple-600/20' :
                        'bg-green-600/20'
                      }`}>
                        {device.deviceType === 'User Terminal' ? '📡' :
                         device.deviceType === 'Router' ? '🌐' :
                         '🔌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-starlink-text truncate">
                          {device.deviceId}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          device.deviceType === 'User Terminal' ? 'bg-blue-600/20 text-blue-400' :
                          device.deviceType === 'Router' ? 'bg-purple-600/20 text-purple-400' :
                          'bg-green-600/20 text-green-400'
                        }`}>
                          {device.deviceType}
                        </span>
                      </div>
                    </div>
                    
                    {/* Live Update Indicator */}
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-starlink-text-secondary">
                        {device.lastUpdate ? new Date(device.lastUpdate).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="space-y-2">
                    {device.latestRecord.DownlinkThroughput !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">↓ Downlink</span>
                        <span className="text-sm font-bold text-starlink-text">{device.latestRecord.DownlinkThroughput} Mbps</span>
                      </div>
                    )}
                    {device.latestRecord.UplinkThroughput !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">↑ Uplink</span>
                        <span className="text-sm font-bold text-starlink-text">{device.latestRecord.UplinkThroughput} Mbps</span>
                      </div>
                    )}
                    {device.latestRecord.PingLatencyMsAvg !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">⏱ Latency</span>
                        <span className={`text-sm font-bold ${
                          device.latestRecord.PingLatencyMsAvg < 50 ? 'text-green-400' :
                          device.latestRecord.PingLatencyMsAvg < 100 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{device.latestRecord.PingLatencyMsAvg} ms</span>
                      </div>
                    )}
                    {device.latestRecord.PingDropRateAvg !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">📉 Drop Rate</span>
                        <span className={`text-sm font-bold ${
                          device.latestRecord.PingDropRateAvg === 0 ? 'text-green-400' :
                          device.latestRecord.PingDropRateAvg < 0.01 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{(device.latestRecord.PingDropRateAvg * 100).toFixed(4)}%</span>
                      </div>
                    )}
                    {device.latestRecord.ObstructionPercentTime !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">🚧 Obstruction</span>
                        <span className={`text-sm font-bold ${
                          device.latestRecord.ObstructionPercentTime === 0 ? 'text-green-400' :
                          device.latestRecord.ObstructionPercentTime < 5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{device.latestRecord.ObstructionPercentTime.toFixed(2)}%</span>
                      </div>
                    )}
                    {device.latestRecord.SignalQuality !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">📶 Signal</span>
                        <span className={`text-sm font-bold ${
                          device.latestRecord.SignalQuality >= 0.8 ? 'text-green-400' :
                          device.latestRecord.SignalQuality >= 0.5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{(device.latestRecord.SignalQuality * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {device.latestRecord.Uptime !== undefined && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">⏰ Uptime</span>
                        <span className="text-sm font-semibold text-starlink-text">{formatUptime(device.latestRecord.Uptime)}</span>
                      </div>
                    )}
                    {device.latestRecord.RunningSoftwareVersion && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">💻 Version</span>
                        <span className="text-xs font-mono text-starlink-text">{device.latestRecord.RunningSoftwareVersion}</span>
                      </div>
                    )}
                    {device.latestRecord.CountryCode && (
                      <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                        <span className="text-xs text-starlink-text-secondary">🌍 Country</span>
                        <span className="text-sm font-semibold text-starlink-text">{device.latestRecord.CountryCode}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Data Points Count */}
                  <div className="mt-3 pt-3 border-t border-starlink-border">
                    <p className="text-[10px] text-starlink-text-secondary text-center">
                      {device.allRecords.length} data point(s) received
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaStream className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary">
                {isStreaming 
                  ? 'Waiting for telemetry data...' 
                  : deviceIdFilter 
                    ? 'No telemetry data found for this device ID'
                    : 'No telemetry data available. Start the stream to begin collecting data.'}
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 card p-4 md:p-6 bg-blue-900/20 border border-blue-700">
          <h3 className="text-sm font-semibold text-starlink-text mb-2">About Telemetry Stream</h3>
          <ul className="text-xs text-starlink-text-secondary space-y-1">
            <li>• Data is retrieved for all devices associated with your account</li>
            <li>• Can be called repeatedly to generate a continuous stream of data</li>
            <li>• Batch Size controls how many records are returned per request</li>
            <li>• Max Linger Time controls how long the server waits while collecting data</li>
            <li>• Use Device ID filter to view telemetry for a specific device only</li>
            <li>• Required Permission: Device telemetry, View</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TelemetryStream;
