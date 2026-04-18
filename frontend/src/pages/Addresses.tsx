import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAddresses, getAddress, getServiceLines } from '../services/api.ts';
import { FaMapMarkerAlt, FaEye, FaArrowLeft, FaLaptop } from 'react-icons/fa';

interface Address {
  addressReferenceId: string;
  addressLines: string[];
  locality: string;
  administrativeArea: string;
  administrativeAreaCode: string;
  region: string;
  regionCode: string;
  postalCode: string;
  metadata: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface AddressesResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content: {
    pageIndex: number;
    limit: number;
    isLastPage: boolean;
    results: Address[];
    totalCount: number;
  };
}

const Addresses: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [addressesData, setAddressesData] = useState<AddressesResponse | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceLinesAtAddress, setServiceLinesAtAddress] = useState<any[]>([]);
  const [loadingServiceLines, setLoadingServiceLines] = useState(false);
  
  // Get filter parameters from URL
  const filterAddressId = searchParams.get('addressId');
  const filterAddressName = searchParams.get('name');

  useEffect(() => {
    // If we have an addressId filter, fetch that specific address and its service lines
    if (filterAddressId) {
      fetchAddressDetails(filterAddressId);
      fetchServiceLinesForAddress(filterAddressId);
    }
    fetchAddresses();
  }, [filterAddressId]);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAddresses();
      setAddressesData(response);
    } catch (err: any) {
      console.error('Failed to fetch addresses:', err);
      setError(err.response?.data?.detail || 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceLinesForAddress = async (addressId: string) => {
    setLoadingServiceLines(true);
    try {
      const response = await getServiceLines({ address_reference_id: addressId });
      console.log('[DEBUG] Service Lines at Address:', response);
      if (response?.content?.results) {
        setServiceLinesAtAddress(response.content.results);
        console.log(`[DEBUG] Found ${response.content.results.length} service lines at address ${addressId}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch service lines for address:', err);
    } finally {
      setLoadingServiceLines(false);
    }
  };

  const fetchAddressDetails = async (addressId: string) => {
    setLoadingDetails(addressId);
    try {
      const response = await getAddress(addressId);
      setSelectedAddress(response.content);
    } catch (err: any) {
      console.error('Failed to fetch address details:', err);
      setError(err.response?.data?.detail || 'Failed to fetch address details');
    } finally {
      setLoadingDetails(null);
    }
  };

  const clearSelectedAddress = () => {
    setSelectedAddress(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-starlink-text-secondary">Loading addresses...</p>
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
          <button onClick={fetchAddresses} className="btn-primary">
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
          <button
            onClick={() => navigate('/admin/service-lines')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Service Lines
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-starlink-text">
            {filterAddressName ? `Service Lines at Address` : 'Starlink Addresses'}
          </h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">
            {filterAddressName ? `Showing service lines for: ${filterAddressName}` : 'View all registered addresses for Starlink services'}
          </p>
        </div>

        {/* Selected Address Details */}
        {selectedAddress && (
          <>
            <div className="card p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text flex items-center gap-2">
                  <FaMapMarkerAlt className="text-starlink-accent" />
                  Address Details
                </h2>
                <button
                  onClick={clearSelectedAddress}
                  className="text-starlink-text-secondary hover:text-starlink-text transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedAddress.addressLines && selectedAddress.addressLines.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Street Address</p>
                    <div className="space-y-1">
                      {selectedAddress.addressLines.map((line, index) => (
                        <p key={index} className="text-sm text-starlink-text">{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAddress.locality && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">City/Locality</p>
                    <p className="text-sm text-starlink-text">{selectedAddress.locality}</p>
                  </div>
                )}

                {selectedAddress.administrativeArea && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">State/Province</p>
                    <p className="text-sm text-starlink-text">{selectedAddress.administrativeArea}</p>
                  </div>
                )}

                {selectedAddress.administrativeAreaCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">State Code</p>
                    <p className="text-sm text-starlink-text font-mono">{selectedAddress.administrativeAreaCode}</p>
                  </div>
                )}

                {selectedAddress.region && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Region</p>
                    <p className="text-sm text-starlink-text">{selectedAddress.region}</p>
                  </div>
                )}

                {selectedAddress.regionCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Region Code</p>
                    <p className="text-sm text-starlink-text font-mono">{selectedAddress.regionCode}</p>
                  </div>
                )}

                {selectedAddress.postalCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Postal Code</p>
                    <p className="text-sm text-starlink-text font-mono">{selectedAddress.postalCode}</p>
                  </div>
                )}

                {selectedAddress.formattedAddress && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Formatted Address</p>
                    <p className="text-sm text-starlink-text">{selectedAddress.formattedAddress}</p>
                  </div>
                )}

                {selectedAddress.latitude !== undefined && selectedAddress.longitude !== undefined && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Coordinates</p>
                    <p className="text-sm text-starlink-text font-mono">
                      Lat: {selectedAddress.latitude}, Lon: {selectedAddress.longitude}
                    </p>
                  </div>
                )}

                {selectedAddress.metadata && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Metadata</p>
                    <pre className="text-xs text-starlink-text-secondary bg-starlink-gray p-3 rounded overflow-x-auto">
                      {selectedAddress.metadata}
                    </pre>
                  </div>
                )}

                <div className="md:col-span-2">
                  <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Reference ID</p>
                  <p className="text-xs text-starlink-text font-mono break-all">{selectedAddress.addressReferenceId}</p>
                </div>
              </div>
            </div>

            {/* Service Lines at This Address */}
            <div className="card p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text flex items-center gap-2">
                  <FaLaptop className="text-starlink-accent" />
                  Service Lines at This Address
                </h2>
                {loadingServiceLines && (
                  <span className="text-xs text-starlink-text-secondary">Loading...</span>
                )}
              </div>

              {serviceLinesAtAddress.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-starlink-text-secondary mb-4">
                    Found <span className="font-semibold text-starlink-text">{serviceLinesAtAddress.length}</span> service line(s) at this address
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceLinesAtAddress.map((serviceLine, index) => (
                      <div
                        key={serviceLine.serviceLineNumber || index}
                        className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-starlink-text truncate">
                            {serviceLine.nickname || serviceLine.serviceLineNumber}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-[10px] ${
                            serviceLine.active 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }`}>
                            {serviceLine.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {serviceLine.serviceLineNumber && (
                            <div>
                              <p className="text-starlink-text-secondary">Service Line #</p>
                              <p className="text-starlink-text font-mono">{serviceLine.serviceLineNumber}</p>
                            </div>
                          )}

                          {serviceLine.productReferenceId && (
                            <div>
                              <p className="text-starlink-text-secondary">Product</p>
                              <p className="text-starlink-text font-mono truncate">{serviceLine.productReferenceId}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-starlink-text-secondary">Public IP</p>
                            <p className="text-starlink-text">{serviceLine.publicIp ? 'Yes' : 'No'}</p>
                          </div>

                          {serviceLine.startDate && (
                            <div>
                              <p className="text-starlink-text-secondary">Start Date</p>
                              <p className="text-starlink-text">{new Date(serviceLine.startDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/admin/service-plan/${serviceLine.serviceLineNumber}`)}
                          className="w-full btn-primary py-1.5 px-3 text-xs flex items-center justify-center gap-2 mt-3"
                        >
                          <FaEye />
                          View Plan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                  <FaLaptop className="text-3xl text-starlink-text-secondary mx-auto mb-3" />
                  <p className="text-sm text-starlink-text-secondary">
                    No service lines found at this address.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Addresses List */}
        <div className="card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
            All Addresses
          </h2>

          {addressesData?.content && addressesData.content.results.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="p-3 bg-starlink-light rounded border border-starlink-border mb-4">
                <p className="text-sm text-starlink-text">
                  Showing <span className="font-semibold">{addressesData.content.results.length}</span> of{' '}
                  <span className="font-semibold">{addressesData.content.totalCount}</span> address(es)
                </p>
              </div>

              {/* Addresses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addressesData.content.results.map((address, index) => (
                  <div
                    key={address.addressReferenceId || index}
                    className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors"
                  >
                    {/* Address Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <FaMapMarkerAlt className="text-starlink-accent text-lg flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-starlink-text line-clamp-2">
                          {address.formattedAddress || address.addressLines?.[0] || 'Address'}
                        </h3>
                      </div>
                    </div>

                    {/* Address Details Preview */}
                    <div className="space-y-2 mb-4">
                      {address.locality && (
                        <p className="text-xs text-starlink-text-secondary">
                          <span className="font-semibold">City:</span> {address.locality}
                        </p>
                      )}
                      
                      {address.administrativeArea && (
                        <p className="text-xs text-starlink-text-secondary">
                          <span className="font-semibold">State:</span> {address.administrativeArea}
                        </p>
                      )}
                      
                      {address.postalCode && (
                        <p className="text-xs text-starlink-text-secondary">
                          <span className="font-semibold">Postal Code:</span> {address.postalCode}
                        </p>
                      )}
                      
                      {address.region && (
                        <p className="text-xs text-starlink-text-secondary">
                          <span className="font-semibold">Region:</span> {address.region}
                        </p>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => fetchAddressDetails(address.addressReferenceId)}
                      disabled={loadingDetails === address.addressReferenceId}
                      className="w-full btn-primary py-1.5 px-3 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loadingDetails === address.addressReferenceId ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <FaEye />
                          View Full Details
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
              <FaMapMarkerAlt className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm md:text-base text-starlink-text-secondary">
                No addresses found.
              </p>
              <p className="text-xs text-starlink-text-secondary mt-2">
                There are no registered addresses in the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Addresses;
