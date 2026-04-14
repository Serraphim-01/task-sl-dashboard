import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceLines } from '../services/api.ts';
import { FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaLaptop, FaWifi, FaDatabase, FaCalendarAlt, FaEye } from 'react-icons/fa';

interface ServiceLine {
  addressReferenceId: string;
  serviceLineNumber: string;
  nickname: string;
  productReferenceId: string;
  delayedProductId: string;
  optInProductId: string;
  startDate: string;
  endDate: string;
  publicIp: boolean;
  active: boolean;
  aviationMetadata?: {
    tailNumber: string;
    seatCount: number;
    airlineIataCode: string;
    aircraftIataCode: string;
    airlineIcaoCode: string;
    aircraftIcaoCode: string;
    stcNumber: string;
  };
  dataBlocks?: any;
}

interface ServiceLinesResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content: {
    pageIndex: number;
    limit: number;
    isLastPage: boolean;
    results: ServiceLine[];
    totalCount: number;
  };
}

const ServiceLines: React.FC = () => {
  const navigate = useNavigate();
  const [serviceLinesData, setServiceLinesData] = useState<ServiceLinesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchString, setSearchString] = useState('');
  const [addressReferenceId, setAddressReferenceId] = useState('');
  const [dataPoolId, setDataPoolId] = useState('');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchServiceLines();
  }, [page]);

  const fetchServiceLines = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        orderByCreatedDateDescending: true
      };

      if (searchString) params.searchString = searchString;
      if (addressReferenceId) params.addressReferenceId = addressReferenceId;
      if (dataPoolId) params.dataPoolId = dataPoolId;

      const response = await getServiceLines(params);
      setServiceLinesData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch service lines');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page on new search
    fetchServiceLines();
  };

  const handleViewDetails = (serviceLineNumber: string) => {
    navigate(`/admin/service-plan/${serviceLineNumber}`);
  };

  const handleReset = () => {
    setSearchString('');
    setAddressReferenceId('');
    setDataPoolId('');
    setPage(0);
    fetchServiceLines();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg text-starlink-text">Loading service lines...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl md:text-3xl font-bold text-starlink-text">Service Lines</h2>
      </div>

      <p className="text-starlink-text-secondary mb-4 md:mb-6 text-sm md:text-base">
        View all Starlink service lines and their details
      </p>

      {error && (
        <div className="p-3 mb-4 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">
          Error: {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-4 md:mb-6">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-starlink-text-secondary" />
                <input
                  type="text"
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                  placeholder="Search by nickname, UT ID, serial number, or service line number..."
                  className="input-field pl-10 w-full text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary py-2 px-4 text-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-4 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors text-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="py-2 px-4 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors text-sm flex items-center gap-2"
            >
              <FaFilter />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-starlink-border">
              <div>
                <label className="block text-xs text-starlink-text-secondary mb-1.5">
                  Address Reference ID
                </label>
                <input
                  type="text"
                  value={addressReferenceId}
                  onChange={(e) => setAddressReferenceId(e.target.value)}
                  placeholder="Filter by address reference ID"
                  className="input-field w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-starlink-text-secondary mb-1.5">
                  Data Pool ID
                </label>
                <input
                  type="text"
                  value={dataPoolId}
                  onChange={(e) => setDataPoolId(e.target.value)}
                  placeholder="Filter by data pool ID"
                  className="input-field w-full text-sm"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results Summary */}
      {serviceLinesData && (
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-sm text-starlink-text-secondary">
            Showing {serviceLinesData.content.results.length} of {serviceLinesData.content.totalCount} service lines
            {serviceLinesData.content.totalCount > 100 && ` (Page ${serviceLinesData.content.pageIndex + 1})`}
          </p>
        </div>
      )}

      {/* Service Lines List */}
      {!serviceLinesData || serviceLinesData.content.results.length === 0 ? (
        <div className="card text-center py-8">
          <FaWifi className="text-4xl text-starlink-text-secondary mx-auto mb-4" />
          <p className="text-starlink-text-secondary text-sm md:text-base">No service lines found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {serviceLinesData.content.results.map((serviceLine, index) => (
              <div key={index} className="card p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <FaLaptop className="text-starlink-accent" />
                    <h3 className="text-sm font-semibold text-starlink-text truncate">
                      {serviceLine.nickname || serviceLine.serviceLineNumber}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] ${
                    serviceLine.active 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    {serviceLine.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <FaCalendarAlt className="text-starlink-text-secondary" />
                    <span className="text-starlink-text-secondary">Start:</span>
                    <span className="text-starlink-text">{formatDate(serviceLine.startDate)}</span>
                  </div>
                  
                  {serviceLine.endDate && (
                    <div className="flex items-center gap-2 text-xs">
                      <FaCalendarAlt className="text-starlink-text-secondary" />
                      <span className="text-starlink-text-secondary">End:</span>
                      <span className="text-starlink-text">{formatDate(serviceLine.endDate)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <FaDatabase className="text-starlink-text-secondary" />
                    <span className="text-starlink-text-secondary">Public IP:</span>
                    <span className="text-starlink-text">{serviceLine.publicIp ? 'Yes' : 'No'}</span>
                  </div>

                  {serviceLine.addressReferenceId && (
                    <div className="pt-2 border-t border-starlink-border">
                      <p className="text-[10px] text-starlink-text-secondary mb-1">Address Reference ID</p>
                      <p className="text-xs text-starlink-text font-mono truncate">
                        {serviceLine.addressReferenceId}
                      </p>
                    </div>
                  )}

                  {serviceLine.aviationMetadata && (
                    <div className="pt-2 border-t border-starlink-border">
                      <p className="text-[10px] text-starlink-text-secondary mb-1">Aviation Metadata</p>
                      {serviceLine.aviationMetadata.tailNumber && (
                        <p className="text-xs text-starlink-text">Tail Number: {serviceLine.aviationMetadata.tailNumber}</p>
                      )}
                      {serviceLine.aviationMetadata.airlineIataCode && (
                        <p className="text-xs text-starlink-text">Airline: {serviceLine.aviationMetadata.airlineIataCode}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* View Plan Button */}
                <button
                  onClick={() => handleViewDetails(serviceLine.serviceLineNumber)}
                  className="btn-primary py-1.5 px-3 text-xs w-full mt-3 flex items-center justify-center gap-2"
                >
                  <FaEye />
                  View Service Plan
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-starlink-light border-b-2 border-starlink-border">
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs">Service Line #</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs">Nickname</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs">Status</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs">Public IP</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs hidden lg:table-cell">Start Date</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs hidden lg:table-cell">End Date</th>
                    <th className="p-3 text-left text-starlink-text font-semibold text-xs hidden xl:table-cell">Address Ref ID</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLinesData.content.results.map((serviceLine, index) => (
                    <tr key={index} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                      <td className="p-3 text-starlink-text text-xs font-mono">{serviceLine.serviceLineNumber || 'N/A'}</td>
                      <td className="p-3 text-starlink-text text-xs font-medium">{serviceLine.nickname || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] ${
                          serviceLine.active 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-white'
                        }`}>
                          {serviceLine.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-starlink-text text-xs">{serviceLine.publicIp ? 'Yes' : 'No'}</td>
                      <td className="p-3 text-starlink-text text-xs hidden lg:table-cell">{formatDate(serviceLine.startDate)}</td>
                      <td className="p-3 text-starlink-text text-xs hidden lg:table-cell">{serviceLine.endDate ? formatDate(serviceLine.endDate) : 'N/A'}</td>
                      <td className="p-3 text-starlink-text text-xs font-mono hidden xl:table-cell truncate max-w-[200px]" title={serviceLine.addressReferenceId}>
                        {serviceLine.addressReferenceId || 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleViewDetails(serviceLine.serviceLineNumber)}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
                        >
                          <FaEye />
                          View Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!serviceLinesData.content.isLastPage && (
            <div className="flex justify-center items-center gap-3 mt-4 md:mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-primary py-2 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaChevronLeft />
                Previous
              </button>
              <span className="text-sm text-starlink-text-secondary">
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                className="btn-primary py-2 px-3 text-sm flex items-center gap-2"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-4 md:mt-8 text-center">
        <button
          onClick={fetchServiceLines}
          className="btn-primary py-2 px-4 text-sm md:text-base"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ServiceLines;
