import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceLine, getBillingPartialPeriods, getCurrentPlan, getUserTerminals } from '../services/api.ts';
import { 
  FaArrowLeft, 
  FaBuilding, 
  FaCalendarAlt, 
  FaWifi, 
  FaCheckCircle, 
  FaTimesCircle,
  FaDatabase,
  FaPlane,
  FaBox,
  FaHdd,
  FaClock,
  FaStar,
  FaDollarSign,
  FaChartLine
} from 'react-icons/fa';

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
  [key: string]: any;
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
  const [currentPlanData, setCurrentPlanData] = useState<CurrentPlanResponse | null>(null);
  const [userTerminalsData, setUserTerminalsData] = useState<UserTerminalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceLineNumber) {
      fetchServiceLineDetails();
    }
  }, [serviceLineNumber]);

  const fetchServiceLineDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceLineNumber) {
        throw new Error('Service line number is required');
      }
      
      // Fetch service line details, billing periods, current plan, and user terminals in parallel
      const [serviceLineResponse, billingPeriodsResponse, currentPlanResponse, userTerminalsResponse] = await Promise.all([
        getServiceLine(serviceLineNumber),
        getBillingPartialPeriods(serviceLineNumber).catch((err) => {
          return null;
        }),
        getCurrentPlan(serviceLineNumber).catch((err) => {
          return null;
        }),
        getUserTerminals(serviceLineNumber).catch((err) => {
          return null;
        })
      ]);
      
      setServiceLineData(serviceLineResponse);
      
      // Set billing periods data even if empty
      if (billingPeriodsResponse) {
        setBillingPeriodsData(billingPeriodsResponse);
      }
      
      // Set current plan data even if empty
      if (currentPlanResponse) {
        setCurrentPlanData(currentPlanResponse);
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
            <FaArrowLeft />
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
                {serviceLineData.content.active ? <FaCheckCircle /> : <FaTimesCircle />}
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
                <FaBuilding className="text-starlink-accent" />
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
                  <p className="text-sm md:text-base text-starlink-text flex items-center gap-2">
                    <FaCalendarAlt className="text-starlink-text-secondary" />
                    {formatDate(serviceLineData.content.startDate)}
                  </p>
                </div>
                <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                  <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">End Date</p>
                  <p className="text-sm md:text-base text-starlink-text flex items-center gap-2">
                    <FaCalendarAlt className="text-starlink-text-secondary" />
                    {serviceLineData.content.endDate ? formatDate(serviceLineData.content.endDate) : 'No End Date'}
                  </p>
                </div>
                <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                  <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Public IP</p>
                  <p className="text-sm md:text-base text-starlink-text flex items-center gap-2">
                    <FaWifi className="text-starlink-accent" />
                    {serviceLineData.content.publicIp ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                {serviceLineData.content.addressReferenceId && (
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border md:col-span-2 lg:col-span-3">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Address Reference ID</p>
                    <p className="text-sm md:text-base text-starlink-text font-mono break-all">{serviceLineData.content.addressReferenceId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aviation Metadata */}
            {serviceLineData.content.aviationMetadata && (
              <div className="card p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                  <FaPlane className="text-starlink-accent" />
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

            {/* Current Plan Details */}
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                <FaStar className="text-starlink-accent" />
                Current Plan Details
              </h2>
              
              {/* Display plan info from service line data */}
              {serviceLineData.content.productReferenceId ? (
                <div className="space-y-6">
                  {/* Service Plan Info */}
                  <div className="p-4 bg-gradient-to-r from-starlink-accent/20 to-starlink-light rounded border border-starlink-accent/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FaStar className="text-2xl text-starlink-accent" />
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-starlink-text">
                            Enterprise 40GB Plan
                          </h3>
                          <p className="text-xs md:text-sm text-starlink-text-secondary mt-1">
                            Business subscription with 40GB included data
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pricing Info - will be added when available */}
                    <div className="p-3 bg-starlink-gray rounded">
                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Plan Details</p>
                      <div className="text-sm text-starlink-text space-y-1">
                        <p><span className="font-semibold">Type:</span> Enterprise Subscription</p>
                        <p><span className="font-semibold">Data Allowance:</span> 40 GB</p>
                        <p><span className="font-semibold">Currency:</span> NGN (Nigerian Naira)</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-starlink-gray rounded">
                      <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Product Reference ID</p>
                      <p className="text-sm text-starlink-text font-mono break-all">{serviceLineData.content.productReferenceId}</p>
                    </div>
                  </div>

                  {/* Data Blocks Status */}
                  <div className="p-4 bg-starlink-light rounded border border-starlink-border">
                    <h3 className="text-base font-semibold text-starlink-text mb-3 flex items-center gap-2">
                      <FaDatabase className="text-starlink-accent" />
                      Current Data Allocation
                    </h3>
                    <p className="text-sm text-starlink-text-secondary">
                      No active data blocks found. The plan's 40GB monthly allocation resets each billing cycle.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                  <FaStar className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
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
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                  <FaHdd className="text-starlink-accent" />
                  Current Billing Cycle - Data Blocks
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.recurringBlocksCurrentBillingCycle.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaBox className="text-starlink-accent" />
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
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                  <FaHdd className="text-starlink-accent" />
                  Next Billing Cycle - Data Blocks
                </h2>
                <div className="space-y-3">
                  {serviceLineData.content.dataBlocks.recurringBlocksNextBillingCycle.map((block, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaBox className="text-starlink-accent" />
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
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                  <FaDatabase className="text-starlink-accent" />
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
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                  <FaDatabase className="text-starlink-accent" />
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

            {/* Billing Partial Periods */}
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
                <FaClock className="text-starlink-accent" />
                Billing Partial Periods
              </h2>
              <p className="text-xs md:text-sm text-starlink-text-secondary mb-4">
                Previous billing partial periods for this service line. 
                <a 
                  href="https://starlink.readme.io/docs/understanding-proration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-starlink-accent hover:underline ml-1"
                >
                  Learn about proration
                </a>
              </p>
              
              {billingPeriodsData?.content && billingPeriodsData.content.length > 0 ? (
                <div className="space-y-3">
                  {billingPeriodsData.content.map((period, index) => (
                    <div key={index} className="p-4 bg-starlink-light rounded border border-starlink-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FaBox className="text-starlink-accent" />
                          <p className="text-sm md:text-base text-starlink-text font-semibold">
                            Product Reference ID
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-starlink-accent text-white text-xs rounded font-mono">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="p-3 bg-starlink-gray rounded mb-3">
                        <p className="text-xs text-starlink-text font-mono break-all">{period.productReferenceId}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <FaCalendarAlt className="text-starlink-text-secondary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Period Start</p>
                            <p className="text-sm text-starlink-text font-medium">
                              {formatDate(period.periodStart)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaCalendarAlt className="text-starlink-text-secondary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Period End</p>
                            <p className="text-sm text-starlink-text font-medium">
                              {formatDate(period.periodEnd)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {period.periodStart && period.periodEnd && (
                        <div className="mt-3 pt-3 border-t border-starlink-border">
                          <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Duration</p>
                          <p className="text-sm text-starlink-text font-semibold">
                            {calculateDaysBetween(period.periodStart, period.periodEnd)} days
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
                  <FaClock className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
                  <p className="text-sm md:text-base text-starlink-text-secondary">
                    No billing partial periods available for this service plan.
                  </p>
                  <p className="text-xs text-starlink-text-secondary mt-2">
                    This service plan has not had any previous billing partial periods.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Terminals */}
        <div className="card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 flex items-center gap-2">
            <FaWifi className="text-starlink-accent" />
            User Terminals
          </h2>
          <p className="text-xs md:text-sm text-starlink-text-secondary mb-4">
            Terminals associated with service line {serviceLineNumber}
          </p>
          
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
                        <FaWifi className="text-starlink-accent" />
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
              <FaWifi className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
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
