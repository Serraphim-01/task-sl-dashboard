import React, { useState, useEffect, useRef } from 'react';
import { getCustomerServiceLine, getCustomerCurrentPlan, getCustomerUserTerminals, getCustomerTelemetry, getBillingPartialPeriods, getUserTerminals, getCustomerUserTerminalDetails, getCustomerRouterDetails, getCustomerRouterConfig, getCustomerProducts, getCustomerAddress } from '../services/api.ts';
import { FaEye, FaMapMarkerAlt, FaStream } from 'react-icons/fa';

const AccountInfo: React.FC = () => {
  const [serviceLineData, setServiceLineData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [currentPlanData, setCurrentPlanData] = useState<any>(null);
  const [currentAddress, setCurrentAddress] = useState<any>(null);
  const [userTerminalsData, setUserTerminalsData] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<{[key: string]: any}>({});
  const [selectedTerminalDetails, setSelectedTerminalDetails] = useState<any>(null);
  const [selectedRouterDetails, setSelectedRouterDetails] = useState<any>(null);
  const [selectedRouterConfig, setSelectedRouterConfig] = useState<any>(null);
  const [loadingTerminalDetails, setLoadingTerminalDetails] = useState<string | null>(null);
  const [loadingRouterDetails, setLoadingRouterDetails] = useState<string | null>(null);
  const [loadingRouterConfig, setLoadingRouterConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = require('../contexts/AuthContext.tsx').useAuth();
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user.serviceLineNumber) {
      fetchServiceLineDetails();
    }
    
    // Cleanup on unmount
    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
        telemetryIntervalRef.current = null;
      }
    };
  }, [user.serviceLineNumber]);

  const fetchServiceLineDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceLineNumber = user.serviceLineNumber;
      
      // Fetch service line details using customer endpoint
      const serviceLineResponse = await getCustomerServiceLine();
      setServiceLineData(serviceLineResponse);
      
      // Fetch current plan details
      fetchCurrentPlan();
      
      // Fetch user terminals
      fetchCustomerUserTerminals();
      
      // Fetch product details if available
      if (serviceLineResponse?.content?.productReferenceId) {
        fetchCustomerProductsAndMatch(serviceLineResponse.content.productReferenceId);
      }
      
      // Fetch address if available
      if (serviceLineResponse?.content?.addressReferenceId) {
        fetchCustomerAddress(serviceLineResponse.content.addressReferenceId);
      }
      
      // Fetch telemetry
      fetchCustomerTelemetry();
      
    } catch (err: any) {
      console.error('Failed to fetch service line details:', err);
      setError(err.response?.data?.detail || 'Failed to fetch service line information');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const response = await getCustomerCurrentPlan();
      if (response?.content) {
        setCurrentPlanData(response.content);
      }
    } catch (err) {
      console.error('Failed to fetch current plan:', err);
      // Don't set error here - plan is supplementary
    }
  };

  const fetchCustomerProductsAndMatch = async (productReferenceId: string) => {
    try {
      const response = await getCustomerProducts();
      const productsArray = response?.content?.results || response?.content || [];
      
      if (Array.isArray(productsArray)) {
        const matchingProduct = productsArray.find(
          (p: any) => p.productReferenceId === productReferenceId || p.id === productReferenceId
        );
        setProductData(matchingProduct || null);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomerAddress = async (addressReferenceId: string) => {
    try {
      const response = await getCustomerAddress(addressReferenceId);
      if (response?.content) {
        setCurrentAddress(response.content);
      }
    } catch (err) {
      console.error('Failed to fetch address:', err);
    }
  };

  const fetchCustomerUserTerminals = async () => {
    try {
      const response = await getCustomerUserTerminals();
      if (response) {
        setUserTerminalsData(response);
      }
    } catch (err) {
      console.error('Failed to fetch user terminals:', err);
    }
  };

  const fetchCustomerTelemetry = async () => {
    try {
      const response = await getCustomerTelemetry();
      
      if (response?.data?.values && response?.data?.columnNamesByDeviceType) {
        const { values, columnNamesByDeviceType } = response.data;
        const updates: {[key: string]: any} = {};
        
        for (const valueArray of values) {
          if (!Array.isArray(valueArray) || valueArray.length === 0) continue;
          
          const deviceType = valueArray[0];
          const columnNames = columnNamesByDeviceType[deviceType];
          
          if (!columnNames) continue;
          
          const record: any = {};
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
            updates[deviceId] = {
              deviceId,
              deviceType: record.deviceType || 'Unknown',
              lastUpdate: record.timestamp,
              latestRecord: record
            };
          }
        }
        
        setTelemetryData(updates);
      }
      
      // Set up real-time polling every 5 seconds
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
      telemetryIntervalRef.current = setInterval(async () => {
        try {
          const response = await getCustomerTelemetry();
          
          if (response?.data?.values && response?.data?.columnNamesByDeviceType) {
            const { values, columnNamesByDeviceType } = response.data;
            const newUpdates: {[key: string]: any} = {};
            
            for (const valueArray of values) {
              if (!Array.isArray(valueArray) || valueArray.length === 0) continue;
              
              const deviceType = valueArray[0];
              const columnNames = columnNamesByDeviceType[deviceType];
              
              if (!columnNames) continue;
              
              const record: any = {};
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
                newUpdates[deviceId] = {
                  deviceId,
                  deviceType: record.deviceType || 'Unknown',
                  lastUpdate: record.timestamp,
                  latestRecord: record
                };
              }
            }
            
            setTelemetryData(newUpdates);
          }
        } catch (err) {
          console.error('Failed to fetch telemetry update:', err);
        }
      }, 5000); // Update every 5 seconds
      
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    }
  };

  const getDeviceTypeLabel = (typeCode: string): string => {
    const typeMap: { [key: string]: string } = {
      'u': 'User Terminal',
      'r': 'Router',
      'i': 'IP Allocation'
    };
    return typeMap[typeCode] || typeCode;
  };

  const nanosecondsToISOString = (ns: number): string => {
    const ms = ns / 1000000;
    return new Date(ms).toISOString();
  };

  const formatDeviceId = (deviceId: string): string => {
    const dashIndex = deviceId.indexOf('-');
    if (dashIndex === -1) {
      if (deviceId.length <= 7) return deviceId;
      return `${deviceId.substring(0, 4)}...${deviceId.slice(-3)}`;
    }
    
    const prefix = deviceId.substring(0, dashIndex);
    const last3 = deviceId.slice(-3);
    return `${prefix}-***${last3}`;
  };

  const fetchTerminalDetails = async (userTerminalId: string) => {
    setLoadingTerminalDetails(userTerminalId);
    setSelectedTerminalDetails(null);
    try {
      const response = await getCustomerUserTerminalDetails(userTerminalId);
      setSelectedTerminalDetails(response);
    } catch (err: any) {
      console.error('Failed to fetch terminal details:', err);
      setError(err.response?.data?.detail || 'Failed to fetch terminal details');
    } finally {
      setLoadingTerminalDetails(null);
    }
  };

  const fetchRouterDetails = async (routerId: string) => {
    setLoadingRouterDetails(routerId);
    setSelectedRouterDetails(null);
    try {
      const response = await getCustomerRouterDetails(routerId);
      setSelectedRouterDetails(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch router details');
    } finally {
      setLoadingRouterDetails(null);
    }
  };

  const fetchRouterConfig = async (configId: string) => {
    setLoadingRouterConfig(configId);
    setSelectedRouterConfig(null);
    try {
      const response = await getCustomerRouterConfig(configId);
      setSelectedRouterConfig(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch router config');
    } finally {
      setLoadingRouterConfig(null);
    }
  };



  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDataAmount = (amount: number, unitType: string) => {
    if (amount === 0) return 'Unlimited';
    if (unitType === 'GB') {
      return amount >= 1024 ? `${(amount / 1024).toFixed(2)} TB` : `${amount} GB`;
    }
    return `${amount} ${unitType}`;
  };

  if (loading) {
    return <div className="p-6 text-center"><h2 className="text-lg text-starlink-text">Loading service line information...</h2></div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">
          Error: {error}
        </div>
        <button onClick={fetchServiceLineDetails} className="mt-3 btn-secondary text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8 text-starlink-text">Service Line Details</h2>

      {serviceLineData?.content ? (
        <div className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Service Line Number</p>
                <p className="text-sm md:text-base text-starlink-text font-mono font-semibold">{serviceLineData.content.serviceLineNumber || 'N/A'}</p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Nickname</p>
                <p className="text-sm md:text-base text-starlink-text font-semibold">{serviceLineData.content.nickname || 'N/A'}</p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Product Reference ID</p>
                <p className="text-sm md:text-base text-starlink-text font-mono break-all">{serviceLineData.content.productReferenceId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Delayed Product ID</p>
                <p className="text-sm md:text-base text-starlink-text font-mono break-all">{serviceLineData.content.delayedProductId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Opt-In Product ID</p>
                <p className="text-sm md:text-base text-starlink-text font-mono break-all">{serviceLineData.content.optInProductId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Start Date</p>
                <p className="text-sm md:text-base text-starlink-text">
                  {formatDate(serviceLineData.content.startDate)}
                </p>
              </div>
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">End Date</p>
                <p className="text-sm md:text-base text-starlink-text">
                  {formatDate(serviceLineData.content.endDate)}
                </p>
              </div>
              {serviceLineData.content.publicIp !== undefined && (
                <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                  <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Public IP</p>
                  <p className="text-sm md:text-base text-starlink-text font-semibold">
                    {serviceLineData.content.publicIp ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
              {serviceLineData.content.active !== undefined && (
                <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                  <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Status</p>
                  <p className={`text-sm md:text-base font-semibold ${
                    serviceLineData.content.active ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {serviceLineData.content.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Service Plan Details */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
              Service Plan Details
            </h2>
            
            {currentPlanData?.servicePlan || productData ? (
              <div className="space-y-4">
                {/* Service Plan Info */}
                {(currentPlanData?.servicePlan || productData) && (
                  <div className="p-4 bg-gradient-to-r from-starlink-accent/20 to-starlink-light rounded border border-starlink-accent/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-bold text-starlink-text">
                          {productData?.name || productData?.displayName || currentPlanData?.servicePlan?.name || 'Enterprise Subscription'}
                        </h3>
                        {(productData?.description || productData?.shortDescription || currentPlanData?.servicePlan?.description) && (
                          <p className="text-xs md:text-sm text-starlink-text-secondary mt-1">
                            {productData?.description || productData?.shortDescription || currentPlanData?.servicePlan?.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Pricing Information */}
                    {(typeof productData?.price === 'number' || productData?.pricing || currentPlanData?.servicePlan?.pricing) && (
                      <div className="p-3 bg-starlink-gray rounded">
                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Pricing</p>
                        <p className="text-sm text-starlink-text font-semibold">
                          {(() => {
                            // Handle direct price field (number)
                            if (typeof productData?.price === 'number') {
                              const currency = productData?.isoCurrencyCode || '';
                              return `${currency} ${productData.price.toLocaleString()}`;
                            }
                            // Handle pricing object from product
                            if (productData?.pricing) {
                              const amount = productData.pricing.amount;
                              const currency = productData.pricing.currency || '';
                              const interval = productData.pricing.interval ? `/${productData.pricing.interval}` : '';
                              return `${currency} ${amount}${interval}`;
                            }
                            // Handle pricing from current plan
                            if (currentPlanData?.servicePlan?.pricing) {
                              const amount = currentPlanData.servicePlan.pricing.amount;
                              const currency = currentPlanData.servicePlan.pricing.currency || '';
                              const interval = currentPlanData.servicePlan.pricing.interval ? `/${currentPlanData.servicePlan.pricing.interval}` : '';
                              return `${currency} ${amount}${interval}`;
                            }
                            return 'N/A';
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Data Blocks - Current Billing Cycle */}
                {currentPlanData?.dataBlocks?.recurringDataBlocks && currentPlanData.dataBlocks.recurringDataBlocks.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-starlink-text mb-3">Current Billing Cycle - Data Blocks</h4>
                    <div className="space-y-3">
                      {currentPlanData.dataBlocks.recurringDataBlocks.map((block: any, index: number) => (
                        <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm md:text-base text-starlink-text font-semibold">Product: {block.productId || 'N/A'}</p>
                            </div>
                            <span className="px-2 py-1 bg-starlink-accent text-white text-xs rounded">
                              Count: {block.count}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Data Amount</p>
                              <p className="text-sm text-starlink-text font-semibold">
                                {formatDataAmount(block.dataAmount, block.dataUnitType)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Start Date</p>
                              <p className="text-sm text-starlink-text">{formatDate(block.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Expiration</p>
                              <p className="text-sm text-starlink-text">{formatDate(block.expirationDate)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top-Up Blocks */}
                {currentPlanData?.dataBlocks?.topUpDataBlocks && currentPlanData.dataBlocks.topUpDataBlocks.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-starlink-text mb-3">Top-Up Data Blocks</h4>
                    <div className="space-y-3">
                      {currentPlanData.dataBlocks.topUpDataBlocks.map((block: any, index: number) => (
                        <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-sm md:text-base text-starlink-text font-semibold mb-2">Product: {block.productId || 'N/A'}</p>
                          <p className="text-xs md:text-sm text-starlink-text-secondary">
                            Amount: {formatDataAmount(block.dataAmount, block.dataUnitType)} | 
                            Count: {block.count} | 
                            Expires: {formatDate(block.expirationDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                <p className="text-sm md:text-base text-starlink-text-secondary mb-2">
                  No service plan information available for your subscription.
                </p>
              </div>
            )}
          </div>

          {/* Aviation Metadata (if exists) */}
          {serviceLineData.content.aviationMetadata && (
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                Aviation Metadata
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceLineData.content.aviationMetadata.tailNumber && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Tail Number</p>
                    <p className="text-sm md:text-base text-starlink-text font-semibold">{serviceLineData.content.aviationMetadata.tailNumber}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.seatCount > 0 && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Seat Count</p>
                    <p className="text-sm md:text-base text-starlink-text font-semibold">{serviceLineData.content.aviationMetadata.seatCount}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.airlineIataCode && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Airline (IATA)</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{serviceLineData.content.aviationMetadata.airlineIataCode}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.aircraftIataCode && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Aircraft (IATA)</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{serviceLineData.content.aviationMetadata.aircraftIataCode}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.airlineIcaoCode && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Airline (ICAO)</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{serviceLineData.content.aviationMetadata.airlineIcaoCode}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.aircraftIcaoCode && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Aircraft (ICAO)</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{serviceLineData.content.aviationMetadata.aircraftIcaoCode}</p>
                  </div>
                )}
                {serviceLineData.content.aviationMetadata.stcNumber && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border md:col-span-2 lg:col-span-3">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">STC Number</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{serviceLineData.content.aviationMetadata.stcNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Address */}
          {currentAddress && (
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                <FaMapMarkerAlt />
                Service Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAddress.addressLines && currentAddress.addressLines.length > 0 && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border md:col-span-2 lg:col-span-3">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Address Lines</p>
                    <p className="text-sm md:text-base text-starlink-text">
                      {currentAddress.addressLines.join(', ')}
                    </p>
                  </div>
                )}
                {currentAddress.locality && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">City/Locality</p>
                    <p className="text-sm md:text-base text-starlink-text font-semibold">{currentAddress.locality}</p>
                  </div>
                )}
                {currentAddress.administrativeArea && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">State/Region</p>
                    <p className="text-sm md:text-base text-starlink-text font-semibold">{currentAddress.administrativeArea}</p>
                  </div>
                )}
                {currentAddress.postalCode && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Postal Code</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">{currentAddress.postalCode}</p>
                  </div>
                )}
                {currentAddress.country && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Country</p>
                    <p className="text-sm md:text-base text-starlink-text font-semibold">{currentAddress.country}</p>
                  </div>
                )}
                {(currentAddress.latitude || currentAddress.longitude) && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Coordinates</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono">
                      {currentAddress.latitude?.toFixed(4) || 'N/A'}, {currentAddress.longitude?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Terminals */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
              User Terminals
            </h2>
            <p className="text-xs md:text-sm text-starlink-text-secondary mb-4">
              Terminals associated with your service line
            </p>
            
            {userTerminalsData?.content && userTerminalsData.content.results && userTerminalsData.content.results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTerminalsData.content.results.map((terminal: any, index: number) => (
                  <div key={terminal.userTerminalId || index} className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors">
                    {/* Terminal Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="text-sm font-semibold text-starlink-text truncate">
                          {terminal.nickname || terminal.kitSerialNumber}
                        </h3>
                      </div>
                      {terminal.online !== undefined && (
                        <span className={`px-2 py-1 rounded-full text-[10px] ${
                          terminal.online 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-white'
                        }`}>
                          {terminal.online ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>

                    {/* Terminal Details */}
                    <div className="space-y-2">
                      {terminal.kitSerialNumber && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Kit Serial Number</p>
                          <p className="text-xs text-starlink-text font-mono break-all">{terminal.kitSerialNumber}</p>
                        </div>
                      )}

                      {terminal.dishSerialNumber && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Dish Serial Number</p>
                          <p className="text-xs text-starlink-text font-mono break-all">{terminal.dishSerialNumber}</p>
                        </div>
                      )}

                      {terminal.userTerminalId && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Terminal ID</p>
                          <p className="text-xs text-starlink-text font-mono break-all">{terminal.userTerminalId}</p>
                        </div>
                      )}

                      {terminal.serviceLineNumber && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Service Line</p>
                          <p className="text-xs text-starlink-text font-mono">{terminal.serviceLineNumber}</p>
                        </div>
                      )}

                      {terminal.hardwareVersion && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Hardware Version</p>
                          <p className="text-xs text-starlink-text">{terminal.hardwareVersion}</p>
                        </div>
                      )}

                      {terminal.softwareVersion && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Software Version</p>
                          <p className="text-xs text-starlink-text font-mono">{terminal.softwareVersion}</p>
                        </div>
                      )}

                      {terminal.activatedDate && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Activated Date</p>
                          <p className="text-xs text-starlink-text">{formatDate(terminal.activatedDate)}</p>
                        </div>
                      )}

                      {terminal.lastSeen && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Last Seen</p>
                          <p className="text-xs text-starlink-text">{formatDate(terminal.lastSeen)}</p>
                        </div>
                      )}

                      {terminal.location && (terminal.location.latitude || terminal.location.longitude) && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Location</p>
                          <p className="text-xs text-starlink-text font-mono">
                            {terminal.location.latitude?.toFixed(4) || 'N/A'}, {terminal.location.longitude?.toFixed(4) || 'N/A'}
                          </p>
                        </div>
                      )}

                      {terminal.status && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Status</p>
                          <p className="text-xs text-starlink-text">{terminal.status}</p>
                        </div>
                      )}

                      {terminal.routers && terminal.routers.length > 0 && (() => {
                        const router = terminal.routers[0];
                        return (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Router ID</p>
                          <p className="text-xs text-starlink-text font-mono break-all">{router.routerId}</p>
                        </div>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 mt-3">
                      <button
                        onClick={() => fetchTerminalDetails(terminal.userTerminalId)}
                        disabled={loadingTerminalDetails === terminal.userTerminalId}
                        className="btn-primary py-1.5 px-3 text-xs w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingTerminalDetails === terminal.userTerminalId ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Loading...
                          </>
                        ) : (
                          <>
                            View L2VPN Configuration
                          </>
                        )}
                      </button>
                      {terminal.routers && terminal.routers.length > 0 && (
                        <button
                          onClick={() => fetchRouterDetails(terminal.routers[0].routerId)}
                          disabled={loadingRouterDetails === terminal.routers[0].routerId}
                          className="btn-primary py-1.5 px-3 text-xs w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loadingRouterDetails === terminal.routers[0].routerId ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Loading...
                            </>
                          ) : (
                            <>
                              View Router Details
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                <p className="text-sm md:text-base text-starlink-text-secondary">
                  No user terminals found for your service line.
                </p>
              </div>
            )}
          </div>

          {/* L2VPN Configuration Details */}
          {selectedTerminalDetails && (
            <div className="card p-4 md:p-6 border-2 border-starlink-accent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text">
                  L2VPN Configuration
                </h2>
                <button
                  onClick={() => setSelectedTerminalDetails(null)}
                  className="text-starlink-text-secondary hover:text-starlink-text transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              
              {selectedTerminalDetails.content && selectedTerminalDetails.content.results && selectedTerminalDetails.content.results.length > 0 ? (
                (() => {
                  const terminalData = selectedTerminalDetails.content.results[0];
                  const l2VpnCircuits = terminalData.l2VpnCircuits || [];
                  
                  return (
                    <div className="space-y-4">
                      {/* Terminal Info */}
                      <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                        <p className="text-xs text-starlink-text-secondary mb-2">
                          L2VPN configuration for terminal: <span className="font-mono font-semibold text-starlink-text">{terminalData.userTerminalId}</span>
                        </p>
                      </div>

                      {/* L2VPN Circuits */}
                      {l2VpnCircuits.length > 0 ? (
                        <div>
                          <h3 className="text-sm font-semibold text-starlink-text mb-3">
                            L2VPN Circuits ({l2VpnCircuits.length})
                          </h3>
                          <div className="space-y-3">
                            {l2VpnCircuits.map((circuit: any, index: number) => (
                              <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="px-2 py-1 bg-starlink-accent text-white text-xs rounded font-semibold">
                                    Circuit #{index + 1}
                                  </span>
                                  {circuit.status && (
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      circuit.status === 'ACTIVE' || circuit.status === 'active'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-600 text-white'
                                    }`}>
                                      {circuit.status}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {circuit.circuitId && (
                                    <div>
                                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Circuit ID</p>
                                      <p className="text-xs text-starlink-text font-mono break-all">{circuit.circuitId}</p>
                                    </div>
                                  )}
                                  {circuit.name && (
                                    <div>
                                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Name</p>
                                      <p className="text-xs text-starlink-text">{circuit.name}</p>
                                    </div>
                                  )}
                                  {circuit.vlanId !== undefined && (
                                    <div>
                                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">VLAN ID</p>
                                      <p className="text-xs text-starlink-text font-mono">{circuit.vlanId}</p>
                                    </div>
                                  )}
                                  {circuit.bandwidth && (
                                    <div>
                                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Bandwidth</p>
                                      <p className="text-xs text-starlink-text">{circuit.bandwidth}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                          <p className="text-sm text-starlink-text-secondary">
                            No L2VPN circuits configured for this terminal.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-6 text-center text-starlink-text-secondary">
                  <p>No L2VPN configuration data available.</p>
                </div>
              )}
            </div>
          )}

          {/* Router Details Section - Click Router ID to View */}
          {selectedRouterDetails && (
            <div className="card p-4 md:p-6 border-2 border-starlink-accent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text">
                  Router Details
                </h2>
                <button
                  onClick={() => setSelectedRouterDetails(null)}
                  className="text-starlink-text-secondary hover:text-starlink-text transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              
              {selectedRouterDetails.content ? (
                <div className="space-y-4">
                  {/* Router Info */}
                  <div className="p-4 bg-starlink-light rounded border border-starlink-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRouterDetails.content.routerId && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Router ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{selectedRouterDetails.content.routerId}</p>
                        </div>
                      )}
                      {selectedRouterDetails.content.nickname && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Nickname</p>
                          <p className="text-sm text-starlink-text font-semibold">{selectedRouterDetails.content.nickname}</p>
                        </div>
                      )}
                      {selectedRouterDetails.content.userTerminalId && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Terminal ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{selectedRouterDetails.content.userTerminalId}</p>
                        </div>
                      )}
                      {selectedRouterDetails.content.hardwareVersion && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Hardware Version</p>
                          <p className="text-sm text-starlink-text">{selectedRouterDetails.content.hardwareVersion}</p>
                        </div>
                      )}
                      {selectedRouterDetails.content.configId && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Config ID</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-starlink-text font-mono break-all flex-1">{selectedRouterDetails.content.configId}</p>
                            <button
                              onClick={() => fetchRouterConfig(selectedRouterDetails.content.configId)}
                              disabled={loadingRouterConfig === selectedRouterDetails.content.configId}
                              className="btn-primary py-1 px-2 text-xs disabled:opacity-50"
                            >
                              {loadingRouterConfig === selectedRouterDetails.content.configId ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                'View Configuration'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {selectedRouterDetails.content.lastBonded && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Last Bonded</p>
                          <p className="text-sm text-starlink-text">{formatDate(selectedRouterDetails.content.lastBonded)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-starlink-text-secondary">
                  <p>No router details available.</p>
                </div>
              )}
            </div>
          )}

          {/* Router Configuration */}
          {selectedRouterConfig && (
            <div className="card p-4 md:p-6 border-2 border-starlink-accent">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text">
                  Router Configuration
                </h2>
                <button
                  onClick={() => setSelectedRouterConfig(null)}
                  className="text-starlink-text-secondary hover:text-starlink-text transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              
              {selectedRouterConfig.content ? (
                <div className="space-y-4">
                  {/* Config ID and Nickname */}
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Configuration ID</p>
                        <p className="text-sm text-starlink-text font-mono font-semibold">{selectedRouterConfig.content.configId}</p>
                      </div>
                      {selectedRouterConfig.content.nickname && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Nickname</p>
                          <p className="text-sm text-starlink-text font-semibold">{selectedRouterConfig.content.nickname}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Router Configuration Details */}
                  {selectedRouterConfig.content.routerConfigJson && (
                    <div>
                      <h3 className="text-sm font-semibold text-starlink-text mb-3">Configuration Details</h3>
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const config = JSON.parse(selectedRouterConfig.content.routerConfigJson);
                            
                            // Helper function to render nested objects as Name-Value pairs
                            const renderObjectAsNameValue = (obj: any, depth: number = 0): React.ReactNode => {
                              if (typeof obj !== 'object' || obj === null) {
                                let displayValue: string;
                                if (typeof obj === 'boolean') {
                                  displayValue = obj ? 'Yes' : 'No';
                                } else if (typeof obj === 'number') {
                                  displayValue = obj.toString();
                                } else if (typeof obj === 'string') {
                                  displayValue = obj;
                                } else {
                                  displayValue = String(obj);
                                }
                                return (
                                  <p className={`text-xs font-mono ${
                                    typeof obj === 'boolean' 
                                      ? obj 
                                        ? 'text-green-400 font-semibold' 
                                        : 'text-red-400'
                                      : 'text-starlink-text'
                                  }`}>
                                    {displayValue}
                                  </p>
                                );
                              }

                              if (Array.isArray(obj)) {
                                return (
                                  <div className="space-y-2">
                                    {obj.map((item: any, index: number) => (
                                      <div key={index} className={`p-${Math.min(depth + 2, 6)} bg-starlink-gray rounded`}>
                                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-2">Item {index + 1}</p>
                                        {typeof item === 'object' && item !== null ? (
                                          <div className="space-y-2">
                                            {Object.entries(item).map(([key, value]) => {
                                              const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                                              return (
                                                <div key={key}>
                                                  <p className="text-[10px] text-starlink-text-secondary uppercase mb-1 capitalize">
                                                    {formattedKey}
                                                  </p>
                                                  {renderObjectAsNameValue(value, depth + 1)}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          renderObjectAsNameValue(item, depth + 1)
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              // Regular object - show as Name-Value pairs
                              return (
                                <div className="space-y-2">
                                  {Object.entries(obj).map(([key, value]) => {
                                    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                                    return (
                                      <div key={key} className={`p-${Math.min(depth + 2, 6)} bg-starlink-gray rounded`}>
                                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-1 capitalize">
                                          {formattedKey}
                                        </p>
                                        {renderObjectAsNameValue(value, depth + 1)}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            };

                            return Object.entries(config).map(([key, value]) => {
                              const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                              return (
                                <div key={key} className="p-3 bg-starlink-light rounded border border-starlink-border">
                                  <div className="flex flex-col md:flex-row md:items-start gap-2">
                                    <div className="md:w-1/3">
                                      <p className="text-xs font-semibold text-starlink-text capitalize">
                                        {formattedKey}
                                      </p>
                                    </div>
                                    <div className="md:w-2/3">
                                      {renderObjectAsNameValue(value)}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          } catch (e) {
                            return (
                              <div className="p-4 bg-starlink-light rounded border border-starlink-border">
                                <p className="text-xs text-red-400">Error parsing configuration JSON</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-starlink-text-secondary">
                  <p>No router configuration data available.</p>
                </div>
              )}
            </div>
          )}

          {/* Device Telemetry */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
              <FaStream />
              Device Telemetry
            </h2>
            <p className="text-xs md:text-sm text-starlink-text-secondary mb-4">
              Real-time telemetry data for your devices (updates every 5 seconds)
            </p>
            
            {Object.keys(telemetryData).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(telemetryData).map(([deviceId, device]: [string, any]) => (
                  <div key={deviceId} className="p-4 bg-starlink-light rounded border border-starlink-border hover:border-starlink-accent/50 transition-colors">
                    {/* Device Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-starlink-text truncate">
                          {device.deviceType}
                        </h3>
                        <p className="text-[10px] text-starlink-text-secondary font-mono truncate mt-1">
                          {formatDeviceId(deviceId)}
                        </p>
                      </div>
                    </div>

                    {/* Device Details */}
                    <div className="space-y-2">
                      {device.lastUpdate && (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Last Update</p>
                          <p className="text-xs text-starlink-text">{formatDate(device.lastUpdate)}</p>
                        </div>
                      )}

                      {/* Display key telemetry metrics */}
                      {device.latestRecord && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-starlink-text-secondary uppercase">Key Metrics</p>
                          <div className="p-2 bg-starlink-gray rounded text-xs text-starlink-text font-mono">
                            {Object.entries(device.latestRecord)
                              .filter(([key, value]) => 
                                !['deviceType', 'deviceId', 'timestamp', 'timestampNs'].includes(key) &&
                                typeof value === 'number' &&
                                value !== 0
                              )
                              .slice(0, 5)
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-starlink-text-secondary">{key}:</span>
                                  <span className="text-starlink-text font-semibold">
                                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                <p className="text-sm md:text-base text-starlink-text-secondary">
                  No telemetry data available. Make sure your devices are connected.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-6">
          <p className="text-starlink-text-secondary">No service line data available</p>
        </div>
      )}

      <button onClick={fetchServiceLineDetails} className="btn-primary mt-6 text-sm">
        Refresh Data
      </button>
    </div>
  );
};

export default AccountInfo;
