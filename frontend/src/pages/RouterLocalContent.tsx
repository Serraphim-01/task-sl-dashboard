import React, { useState, useEffect } from 'react';
import { getRouterLocalContent } from '../services/api.ts';
import { FaFile, FaDownload } from 'react-icons/fa';

interface LocalContentFile {
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  lastModified?: string;
  [key: string]: any;
}

const RouterLocalContent: React.FC = () => {
  const [contentFiles, setContentFiles] = useState<LocalContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContentFiles();
  }, []);

  const fetchContentFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRouterLocalContent();
      if (response?.content?.results) {
        setContentFiles(response.content.results);
      } else if (response?.content) {
        setContentFiles(Array.isArray(response.content) ? response.content : [response.content]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch router local content files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-starlink-text-secondary">Loading router content files...</p>
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
          <button onClick={fetchContentFiles} className="btn-primary">
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
            <FaFile className="text-starlink-accent" />
            Router Local Content Files
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            View and manage local content files stored on routers
          </p>
        </div>

        {/* Content Files List */}
        <div className="card p-4 md:p-6">
          {contentFiles.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="p-3 bg-starlink-light rounded border border-starlink-border mb-4">
                <p className="text-sm text-starlink-text">
                  Found <span className="font-semibold">{contentFiles.length}</span> content file(s)
                </p>
              </div>

              {/* Files Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <FaFile className="text-starlink-accent text-lg mt-1 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-starlink-text break-all">
                        {file.fileName || 'Unnamed File'}
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      {file.contentType && (
                        <div>
                          <p className="text-starlink-text-secondary">Content Type</p>
                          <p className="text-starlink-text font-mono">{file.contentType}</p>
                        </div>
                      )}

                      {file.fileSize !== undefined && (
                        <div>
                          <p className="text-starlink-text-secondary">File Size</p>
                          <p className="text-starlink-text">{formatFileSize(file.fileSize)}</p>
                        </div>
                      )}

                      {file.lastModified && (
                        <div>
                          <p className="text-starlink-text-secondary">Last Modified</p>
                          <p className="text-starlink-text">{formatDate(file.lastModified)}</p>
                        </div>
                      )}

                      {/* Display other fields */}
                      {Object.keys(file)
                        .filter(key => !['fileName', 'fileSize', 'contentType', 'lastModified'].includes(key))
                        .slice(0, 2)
                        .map(key => (
                          <div key={key}>
                            <p className="text-starlink-text-secondary">{key}</p>
                            <p className="text-starlink-text font-mono truncate">
                              {typeof file[key] === 'object' ? JSON.stringify(file[key]) : String(file[key])}
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
              <FaFile className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary">
                No local content files found.
              </p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button onClick={fetchContentFiles} className="btn-primary py-2 px-4">
            Refresh Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouterLocalContent;
