import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceLine, getBillingPartialPeriods, getUserTerminals, getUserTerminalDetails, getRouterDetails, getRouterConfig, getDefaultRouterConfig, getProducts } from '../services/api.ts';
import { FaEye } from 'react-icons/fa';

interface DataBlock {
  productId: string;
  startDate: string;
  expirationDate: string;
  count: number;
  dataAmount: number;
  dataUnitType: string;
}

interface AviationMetadata {
  tailNumber: string;
  seatCount: number;
  airlineIataCode: string;
  aircraftIataCode: string;
  airlineIcaoCode: string;
  aircraftIcaoCode: string;
  stcNumber: string;
}

interface ServiceLineContent {
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
  aviationMetadata?: AviationMetadata;
  dataBlocks?: {
    recurringBlocksCurrentBillingCycle: DataBlock[];
    recurringBlocksNextBillingCycle: DataBlock[];
    delayedProductRecurringBlocksNextCycle: DataBlock[];
    topUpBlocksOptInPurchase: DataBlock[];
    topUpBlocksOneTimePurchase: DataBlock[];
  };
}

interface ServiceLineResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content: ServiceLineContent;
}

interface BillingPartialPeriod {
  productReferenceId: string;
  periodStart: string;
  periodEnd: string;
}

interface BillingPartialPeriodsResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content: BillingPartialPeriod[];
}

interface ServicePlan {
  productId: string;
  name?: string;
  pricing?: {
    amount: number;
    currency: string;
    interval?: string;
  };
  description?: string;
}

interface DataBlockInfo {
  productId: string;
  startDate: string;
  expirationDate: string;
  count: number;
  dataAmount: number;
  dataUnitType: string;
}

interface CurrentPlanContent {
  servicePlan?: ServicePlan;
  dataBlocks?: {
    activeDataBlocks?: DataBlockInfo[];
    recurringDataBlocks?: DataBlockInfo[];
    topUpDataBlocks?: DataBlockInfo[];
  };
}

interface CurrentPlanResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content: CurrentPlanContent;
}

interface UserTerminal {
  userTerminalId: string;
  kitSerialNumber: string;
  dishSerialNumber: string;
  serviceLineNumber: string;
  nickname?: string;
  status?: string;
  online?: boolean;
  hardwareVersion?: string;
  softwareVersion?: string;
  activatedDate?: string;
  lastSeen?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  serviceLineNumbers?: string[];
  l2VpnCircuits?: any[];
  routers?: Array<{
    routerId: string;
    nickname?: string;
    userTerminalId?: string;
    configId?: string;
    hardwareVersion?: string;
    lastBonded?: string;
  }>;
}

interface UserTerminalsResponse {
  errors: any[];
  warnings: any[];
  information: string[];
  isValid: boolean;
  content?: {
    pageIndex: number;
    limit: number;
    isLastPage: boolean;
    results: UserTerminal[];
    totalCount: number;
  };
}

const ServicePlan: React.FC = () => {
  const { serviceLineNumber } = useParams<{ serviceLineNumber: string }>();
  const navigate = useNavigate();
  const [serviceLineData, setServiceLineData] = useState<ServiceLineResponse | null>(null);
  const [billingPeriodsData, setBillingPeriodsData] = useState<BillingPartialPeriodsResponse | null>(null);
  const [userTerminalsData, setUserTerminalsData] = useState<UserTerminalsResponse | null>(null);
  const [selectedTerminalDetails, setSelectedTerminalDetails] = useState<any>(null);
  const [loadingTerminalDetails, setLoadingTerminalDetails] = useState<string | null>(null);
  const [selectedRouterDetails, setSelectedRouterDetails] = useState<any>(null);
  const [loadingRouterDetails, setLoadingRouterDetails] = useState<string | null>(null);
  const [selectedRouterConfig, setSelectedRouterConfig] = useState<any>(null);
  const [loadingRouterConfig, setLoadingRouterConfig] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [defaultRouterConfig, setDefaultRouterConfig] = useState<any>(null);
  const [loadingDefaultConfig, setLoadingDefaultConfig] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceLineNumber) {
      fetchServiceLineDetails();
    }
  }, [serviceLineNumber]);

  const fetchProductsAndMatch = async (productReferenceId: string) => {
    setLoadingProduct(true);
    try {
      const response = await getProducts();
      console.log('[DEBUG] All Products Response:', response);
      const productsArray = response?.content?.results || response?.content || [];
      
      if (Array.isArray(productsArray)) {
        const matchingProduct = productsArray.find(
          (p: any) => p.productReferenceId === productReferenceId || p.id === productReferenceId
        );
        console.log('[DEBUG] Matching Product:', matchingProduct);
        setProductData(matchingProduct || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      // Don't set error here - product is supplementary
    } finally {
      setLoadingProduct(false);
    }
  };

  const fetchServiceLineDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceLineNumber) {
        throw new Error('Service line number is required');
      }
      
      // Fetch service line details, billing periods, and user terminals in parallel
      const [serviceLineResponse, billingPeriodsResponse, userTerminalsResponse] = await Promise.all([
        getServiceLine(serviceLineNumber),
        getBillingPartialPeriods(serviceLineNumber).catch((err) => {
          return null;
        }),
        getUserTerminals(serviceLineNumber).catch((err) => {
          return null;
        })
      ]);
      
      setServiceLineData(serviceLineResponse);
      
      // Fetch product details if productReferenceId exists
      if (serviceLineResponse?.content?.productReferenceId) {
        fetchProductsAndMatch(serviceLineResponse.content.productReferenceId);
      }
      
      // Debug: Log the API responses
      console.log('[DEBUG] Service Line Response:', serviceLineResponse);
      console.log('[DEBUG] Billing Periods Response:', billingPeriodsResponse);
      console.log('[DEBUG] User Terminals Response:', userTerminalsResponse);
      
      // Set billing periods data even if empty
      if (billingPeriodsResponse) {
        setBillingPeriodsData(billingPeriodsResponse);
      }
      
      // Set user terminals data even if empty
      if (userTerminalsResponse) {
        setUserTerminalsData(userTerminalsResponse);
      }
    } catch (err: any) {
      console.error('\n[ERROR] Failed to fetch service line details:', err);
      setError(err.response?.data?.detail || 'Failed to fetch service line details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const calculateDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchTerminalDetails = async (userTerminalId: string) => {
    setLoadingTerminalDetails(userTerminalId);
    setSelectedTerminalDetails(null);
    try {
      const response = await getUserTerminalDetails(userTerminalId);
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
      const response = await getRouterDetails(routerId);
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
      const response = await getRouterConfig(configId);
      setSelectedRouterConfig(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch router config');
    } finally {
      setLoadingRouterConfig(null);
    }
  };

  const fetchDefaultRouterConfig = async () => {
    setLoadingDefaultConfig(true);
    setDefaultRouterConfig(null);
    try {
      const response = await getDefaultRouterConfig();
      setDefaultRouterConfig(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch default router config');
    } finally {
      setLoadingDefaultConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker flex items-center justify-center">
        <div className="text-starlink-text text-lg">Loading service plan details...</div>
      </div>
    );
  }

  if (!serviceLineNumber) {
    return (
      <div className="min-h-screen bg-starlink-darker flex items-center justify-center">
        <div className="text-red-500 text-lg">Service line number is required</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-starlink-darker p-3 md:p-6 lg:p-8 ml-[25px] md:ml-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => navigate('/admin/service-lines')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-3 text-sm"
          >
            <span>←</span>
            <span>Back to Service Lines</span>
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold text-starlink-text">
              Service Plan Details
            </h1>
            {serviceLineData?.content && (
              <span className={`px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 ${
                serviceLineData.content.active 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {serviceLineData.content.active ? '✓' : '✗'}
                {serviceLineData.content.active ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {serviceLineData?.content && (
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
              </div>
            </div>

            {/* Aviation Metadata */}
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

            {/* Service Plan Information */}
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
                Service Plan Details
              </h2>
              
              {/* Display plan info from service line data */}
              {serviceLineData.content.productReferenceId ? (
                <div className="space-y-6">
                  {/* Service Plan Info */}
                  {(() => {
                    // Debug: Log product data
                    console.log('[DEBUG] Product Data:', productData);
                    
                    return (
                      <div className="p-4 bg-gradient-to-r from-starlink-accent/20 to-starlink-light rounded border border-starlink-accent/30">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg md:text-xl font-bold text-starlink-text">
                              {productData?.name || productData?.displayName || 'Enterprise Subscription'}
                            </h3>
                            {(productData?.description || productData?.shortDescription) && (
                              <p className="text-xs md:text-sm text-starlink-text-secondary mt-1">
                                {productData?.description || productData?.shortDescription}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Pricing Information - Handle both direct price field and pricing object */}
                        {((typeof productData?.price === 'number') || productData?.pricing) && (
                          <div className="p-3 bg-starlink-gray rounded">
                            <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Pricing</p>
                            <p className="text-sm text-starlink-text font-semibold">
                              {(() => {
                                // Handle direct price field (number)
                                if (typeof productData?.price === 'number') {
                                  const currency = productData?.isoCurrencyCode || '';
                                  return `${currency} ${productData.price.toLocaleString()}`;
                                }
                                // Handle pricing object
                                if (productData?.pricing) {
                                  const amount = productData.pricing.amount;
                                  const currency = productData.pricing.currency || '';
                                  const interval = productData.pricing.interval ? `/${productData.pricing.interval}` : '';
                                  return `${currency} ${amount}${interval}`;
                                }
                                return 'N/A';
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                  <p className="text-sm md:text-base text-starlink-text-secondary mb-2">
                    No plan information available for this service line.
                  </p>
                </div>
              )}
            </div>

            {/* Data Blocks - Current Billing Cycle */}
            {serviceLineData.content.dataBlocks?.recurringBlocksCurrentBillingCycle && 
             serviceLineData.content.dataBlocks.recurringBlocksCurrentBillingCycle.length > 0 && (
              <div className="card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
                  Current Billing Cycle - Data Blocks
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.recurringBlocksCurrentBillingCycle.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm md:text-base text-starlink-text font-semibold">Product: {block.productId}</p>
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

            {/* Data Blocks - Next Billing Cycle */}
            {serviceLineData.content.dataBlocks?.recurringBlocksNextBillingCycle && 
             serviceLineData.content.dataBlocks.recurringBlocksNextBillingCycle.length > 0 && (
              <div className="card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
                  Next Billing Cycle - Data Blocks
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.recurringBlocksNextBillingCycle.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm md:text-base text-starlink-text font-semibold">Product: {block.productId}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
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

            {/* Top-Up Blocks - Opt-In Purchase */}
            {serviceLineData.content.dataBlocks?.topUpBlocksOptInPurchase && 
             serviceLineData.content.dataBlocks.topUpBlocksOptInPurchase.length > 0 && (
              <div className="card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
                  Top-Up Blocks - Opt-In Purchase
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.topUpBlocksOptInPurchase.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <p className="text-sm md:text-base text-starlink-text font-semibold mb-2">Product: {block.productId}</p>
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

            {/* Top-Up Blocks - One-Time Purchase */}
            {serviceLineData.content.dataBlocks?.topUpBlocksOneTimePurchase && 
             serviceLineData.content.dataBlocks.topUpBlocksOneTimePurchase.length > 0 && (
              <div className="card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4">
                  Top-Up Blocks - One-Time Purchase
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.topUpBlocksOneTimePurchase.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <p className="text-sm md:text-base text-starlink-text font-semibold mb-2">Product: {block.productId}</p>
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
        )}

        {/* User Terminals */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text">
                User Terminals
              </h2>
              <p className="text-xs md:text-sm text-starlink-text-secondary mb-4">
                Terminals associated with service line {serviceLineNumber}
              </p>
            </div>
            <button
              onClick={fetchDefaultRouterConfig}
              disabled={loadingDefaultConfig}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {loadingDefaultConfig ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  View Default Router Config
                </>
              )}
            </button>
          </div>
          
          {userTerminalsData?.content && userTerminalsData.content.results.length > 0 ? (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                <p className="text-sm text-starlink-text">
                  Showing <span className="font-semibold">{userTerminalsData.content.results.length}</span> of{' '}
                  <span className="font-semibold">{userTerminalsData.content.totalCount}</span> terminal(s)
                </p>
              </div>

              {/* Terminals List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTerminalsData.content.results.map((terminal, index) => (
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
                        const router = terminal.routers![0];
                        return (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Router ID</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-starlink-text font-mono break-all flex-1">{router.routerId}</p>
                            <button
                              onClick={() => fetchRouterDetails(router.routerId)}
                              disabled={loadingRouterDetails === router.routerId}
                              className="p-1.5 text-starlink-text-secondary hover:text-starlink-accent transition-colors disabled:opacity-50"
                              title="View Router Details"
                            >
                              {loadingRouterDetails === router.routerId ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <FaEye />
                              )}
                            </button>
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                    
                    {/* View L2VPN Details Button */}
                    <button
                      onClick={() => fetchTerminalDetails(terminal.userTerminalId)}
                      disabled={loadingTerminalDetails === terminal.userTerminalId}
                      className="btn-primary py-1.5 px-3 text-xs w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
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
                  </div>
                ))}
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
                                    
                                    {circuit.description && (
                                      <div className="md:col-span-2">
                                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Description</p>
                                        <p className="text-xs text-starlink-text">{circuit.description}</p>
                                      </div>
                                    )}
                                    
                                    {/* Add any other circuit properties */}
                                    {Object.keys(circuit).filter(key => 
                                      !['circuitId', 'name', 'vlanId', 'description', 'status'].includes(key)
                                    ).length > 0 && (
                                      <div className="md:col-span-2">
                                        <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Additional Configuration</p>
                                        <pre className="text-xs text-starlink-text font-mono bg-starlink-darker p-2 rounded overflow-x-auto">
                                          {JSON.stringify(
                                            Object.fromEntries(
                                              Object.keys(circuit)
                                                .filter(key => !['circuitId', 'name', 'vlanId', 'description', 'status'].includes(key))
                                                .map(key => [key, circuit[key]])
                                            ),
                                            null,
                                            2
                                          )}
                                        </pre>
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

              {/* Router Details */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRouterDetails.content.routerId && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Router ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{selectedRouterDetails.content.routerId}</p>
                        </div>
                      )}
                      
                      {selectedRouterDetails.content.nickname && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Nickname</p>
                          <p className="text-sm text-starlink-text">{selectedRouterDetails.content.nickname}</p>
                        </div>
                      )}
                      
                      {selectedRouterDetails.content.userTerminalId && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">User Terminal ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{selectedRouterDetails.content.userTerminalId}</p>
                        </div>
                      )}
                      
                      {selectedRouterDetails.content.configId && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Config ID</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-starlink-text font-mono break-all flex-1">{selectedRouterDetails.content.configId}</p>
                            <button
                              onClick={() => fetchRouterConfig(selectedRouterDetails.content.configId)}
                              disabled={loadingRouterConfig === selectedRouterDetails.content.configId}
                              className="p-1.5 text-starlink-text-secondary hover:text-starlink-accent transition-colors disabled:opacity-50"
                              title="View Router Config"
                            >
                              {loadingRouterConfig === selectedRouterDetails.content.configId ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <FaEye />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedRouterDetails.content.hardwareVersion && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Hardware Version</p>
                          <p className="text-sm text-starlink-text">{selectedRouterDetails.content.hardwareVersion}</p>
                        </div>
                      )}
                      
                      {selectedRouterDetails.content.lastBonded && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Last Bonded</p>
                          <p className="text-sm text-starlink-text">{formatDate(selectedRouterDetails.content.lastBonded)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-starlink-text-secondary">
                    <p>No router details available.</p>
                  </div>
                )}
                </div>
              )}

              {/* Router Config */}
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
                    {/* Config Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {selectedRouterConfig.content.configId && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Config ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{selectedRouterConfig.content.configId}</p>
                        </div>
                      )}
                      
                      {selectedRouterConfig.content.nickname && (
                        <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Nickname</p>
                          <p className="text-sm text-starlink-text">{selectedRouterConfig.content.nickname}</p>
                        </div>
                      )}
                    </div>

                    {/* Router Config - User Friendly Display */}
                    {selectedRouterConfig.content.routerConfigJson && (() => {
                      try {
                        const config = JSON.parse(selectedRouterConfig.content.routerConfigJson);
                        
                        // Check if a field is sensitive (contains password, key, secret, token)
                        const isSensitiveField = (fieldName: string) => {
                          const lowerField = fieldName.toLowerCase();
                          return lowerField.includes('password') || 
                                 lowerField.includes('passwd') || 
                                 lowerField.includes('pass') ||
                                 lowerField.includes('key') ||
                                 lowerField.includes('secret') ||
                                 lowerField.includes('token');
                        };
                        
                        // Toggle password visibility
                        const togglePasswordVisibility = (fieldKey: string) => {
                          setVisiblePasswords(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(fieldKey)) {
                              newSet.delete(fieldKey);
                            } else {
                              newSet.add(fieldKey);
                            }
                            return newSet;
                          });
                        };
                        
                        // Helper function to render nested objects nicely
                        const renderValue = (value: any, fieldKey: string = ''): React.ReactNode => {
                          if (typeof value === 'boolean') {
                            return (
                              <span className={value ? 'text-green-400' : 'text-red-400'}>
                                {value ? 'Enabled' : 'Disabled'}
                              </span>
                            );
                          } else if (value === null || value === undefined) {
                            return <span className="text-starlink-text-muted">—</span>;
                          } else if (typeof value === 'object' && !Array.isArray(value)) {
                            // Handle nested objects (like networks)
                            return (
                              <div className="space-y-1 mt-1">
                                {Object.entries(value).map(([nestedKey, nestedValue]) => (
                                  <div key={nestedKey} className="flex items-start gap-2">
                                    <span className="text-xs text-starlink-text-secondary min-w-[120px]">
                                      {nestedKey.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
                                    </span>
                                    <span className="text-xs text-starlink-text">
                                      {renderValue(nestedValue, `${fieldKey}.${nestedKey}`)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          } else if (Array.isArray(value)) {
                            // Handle arrays
                            return (
                              <div className="space-y-1">
                                {value.map((item: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-starlink-darker rounded border border-starlink-border">
                                    {typeof item === 'object' && item !== null ? (
                                      <div className="space-y-1">
                                        {Object.entries(item).map(([k, v]) => {
                                          const fieldLabel = k
                                            .replace(/([A-Z])/g, ' $1')
                                            .replace(/^\w/, (c) => c.toUpperCase());
                                          return (
                                            <div key={k} className="flex items-start gap-2">
                                              <span className="text-xs text-starlink-text-secondary min-w-[120px]">
                                                {fieldLabel}
                                              </span>
                                              <span className="text-xs text-starlink-text">
                                                {renderValue(v, `${fieldKey}.${k}`)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-starlink-text">{String(item)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // Handle primitive values
                            return <span className="text-starlink-text font-medium">{String(value)}</span>;
                          }
                        };
                        
                        // Render value with password masking
                        const renderValueWithMasking = (key: string, value: any) => {
                          if (isSensitiveField(key) && typeof value === 'string') {
                            const isVisible = visiblePasswords.has(key);
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-starlink-text font-mono">
                                  {isVisible ? value : '••••••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(key)}
                                  className="text-xs text-starlink-accent hover:text-starlink-accent/80 transition-colors"
                                  title={isVisible ? 'Hide password' : 'Show password'}
                                >
                                  {isVisible ? <span>🙈</span> : <FaEye />}
                                </button>
                              </div>
                            );
                          }
                          return renderValue(value, key);
                        };
                        
                        return (
                          <div>
                            <p className="text-xs font-semibold text-starlink-text-secondary uppercase tracking-wide mb-2">Configuration Settings</p>
                            <div className="space-y-1">
                              {/* Display each config setting as compact rows */}
                              {Object.entries(config).map(([key, value]) => {
                                const label = key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/_/g, ' ')
                                  .replace(/^\w/, (c) => c.toUpperCase());
                                
                                return (
                                  <div key={key} className="flex items-start gap-3 p-2 bg-starlink-light/50 rounded hover:bg-starlink-light transition-colors">
                                    <span className="text-xs font-semibold text-starlink-text-secondary min-w-[140px] pt-0.5">{label}</span>
                                    <div className="flex-1 text-xs">{renderValueWithMasking(key, value)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      } catch (e) {
                        return (
                          <div>
                            <p className="text-[10px] text-starlink-text-secondary uppercase mb-2">Raw Configuration</p>
                            <pre className="text-xs text-starlink-text font-mono bg-starlink-darker p-4 rounded overflow-x-auto border border-starlink-border max-h-96 overflow-y-auto">
                              {selectedRouterConfig.content.routerConfigJson}
                            </pre>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <div className="p-6 text-center text-starlink-text-secondary">
                    <p>No router configuration available.</p>
                  </div>
                )}
                </div>
              )}

              {/* Default Router Config */}
              {defaultRouterConfig && (
                <div className="card p-4 md:p-6 border-2 border-starlink-accent">
                  <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                    Default Router Configuration
                  </h2>
                
                {defaultRouterConfig.content ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-starlink-accent/10 border border-starlink-accent rounded">
                      <p className="text-xs text-starlink-text-secondary mb-2">
                        This is the configuration that will be automatically assigned to new routers when they are first added to this account.
                      </p>
                      {defaultRouterConfig.content.configId ? (
                        <div>
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Default Config ID</p>
                          <p className="text-sm text-starlink-text font-mono break-all">{defaultRouterConfig.content.configId}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-starlink-text-secondary italic">
                          No default configuration has been set. New routers will not be automatically assigned a config.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-starlink-text-secondary">
                    <p>No default router configuration available.</p>
                  </div>
                )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
              <p className="text-sm md:text-base text-starlink-text-secondary">
                No user terminals found for this service line.
              </p>
              <p className="text-xs text-starlink-text-secondary mt-2">
                Terminals will appear here once they are associated with this service line.
              </p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchServiceLineDetails}
            className="btn-primary py-2 px-6 text-sm md:text-base"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePlan;
