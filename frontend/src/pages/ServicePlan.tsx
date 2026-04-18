import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceLine, getBillingPartialPeriods, getUserTerminals, getUserTerminalDetails, getRouterDetails, getRouterConfig, getDefaultRouterConfig, getProducts, getServiceLineTelemetry, getAddresses, addAddressToServiceLine } from '../services/api.ts';
import { FaEye, FaStream, FaMapMarkerAlt, FaPlus, FaTimes } from 'react-icons/fa';

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

interface DeviceTelemetryData {
  deviceId: string;
  deviceType: string;
  lastUpdate?: string;
  latestRecord: ParsedTelemetryRecord;
}

interface ParsedTelemetryRecord {
  deviceType?: string;
  deviceId?: string;
  timestamp?: string;
  timestampNs?: number;
  [key: string]: any;
}

interface Address {
  addressReferenceId: string;
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  administrativeAreaCode?: string;
  region?: string;
  regionCode?: string;
  postalCode?: string;
  metadata?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  displayName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
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
  
  // Telemetry state
  const [telemetryData, setTelemetryData] = useState<{[key: string]: DeviceTelemetryData}>({});
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  
  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (serviceLineNumber) {
      fetchServiceLineDetails();
    }
  }, [serviceLineNumber]);
  
  const fetchAddresses = async () => {
    try {
      const response = await getAddresses();
      if (response?.content?.results) {
        setAddresses(response.content.results);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };
  
  const fetchCurrentAddress = async (addressReferenceId: string) => {
    if (!addressReferenceId) {
      setCurrentAddress(null);
      return;
    }
    try {
      const { getAddress } = await import('../services/api.ts');
      const response = await getAddress(addressReferenceId);
      if (response?.content) {
        setCurrentAddress(response.content);
      }
    } catch (err) {
      console.error('Failed to fetch current address:', err);
      setCurrentAddress(null);
    }
  };
  
  const fetchTelemetryForServiceLine = async () => {
    setTelemetryLoading(true);
    setTelemetryData({});
    
    try {
      // First, get the user terminals for this service line to extract device IDs
      const userTerminalsResponse = await getUserTerminals(serviceLineNumber!);
      
      // Collect all device IDs (routers + user terminals) that belong to this service line
      const deviceIds = new Set<string>();
      
      if (userTerminalsResponse?.content?.results) {
        const terminals = userTerminalsResponse.content.results;
        
        console.log('[DEBUG] User Terminals from API:', terminals.map((t: UserTerminal) => ({
          userTerminalId: t.userTerminalId,
          kitSerialNumber: t.kitSerialNumber,
          routers: t.routers?.length || 0
        })));
        
        // Extract all device IDs: user terminals, routers, and IP allocations
        terminals.forEach((terminal: UserTerminal) => {
          // Add user terminal ID with 'ut' prefix to match telemetry format
          if (terminal.userTerminalId) {
            // Check if it already has 'ut' prefix, if not add it
            const utId = terminal.userTerminalId.startsWith('ut') 
              ? terminal.userTerminalId 
              : `ut${terminal.userTerminalId}`;
            deviceIds.add(utId);
          }
          
          // Add all router IDs from this terminal
          if (terminal.routers && terminal.routers.length > 0) {
            terminal.routers.forEach(router => {
              if (router.routerId) {
                // Add both with and without "Router-" prefix to handle telemetry format
                deviceIds.add(router.routerId);
                deviceIds.add(`Router-${router.routerId}`);
              }
            });
          }
          
          // Add IP allocation IDs if they exist
          if (terminal.l2VpnCircuits && terminal.l2VpnCircuits.length > 0) {
            terminal.l2VpnCircuits.forEach((circuit: any) => {
              // Check if circuit has an associated IP allocation device ID
              if (circuit.ipAllocationId) {
                deviceIds.add(circuit.ipAllocationId);
              }
            });
          }
        });
      }
      
      // If no devices found, return empty
      if (deviceIds.size === 0) {
        console.log('[DEBUG] No routers or user terminals found for this service line');
        setTelemetryData({});
        setTelemetryLoading(false);
        return;
      }
      
      console.log('[DEBUG] Device IDs to filter:', Array.from(deviceIds));
      
      // Fetch telemetry stream
      const response = await getServiceLineTelemetry(serviceLineNumber!);
      
      // Debug: Log full telemetry before filtering
      console.log('[DEBUG] Full telemetry response (before filtering):', response?.data);
      
      if (response?.data?.values && response?.data?.columnNamesByDeviceType) {
        const { values, columnNamesByDeviceType } = response.data;
        const updates: {[key: string]: DeviceTelemetryData} = {};
        
        for (const valueArray of values) {
          if (!Array.isArray(valueArray) || valueArray.length === 0) continue;
          
          const deviceType = valueArray[0];
          const columnNames = columnNamesByDeviceType[deviceType];
          
          if (!columnNames) continue;
          
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
          
          // Only include devices (routers or user terminals) that belong to this service line
          if (deviceId && deviceIds.has(deviceId)) {
            updates[deviceId] = {
              deviceId,
              deviceType: record.deviceType || 'Unknown',
              lastUpdate: record.timestamp,
              latestRecord: record
            };
          }
        }
        
        console.log(`[DEBUG] Filtered telemetry for ${Object.keys(updates).length} devices (routers + user terminals) belonging to this service line`);
        setTelemetryData(updates);
      }
    } catch (err: any) {
      console.error('Failed to fetch telemetry:', err);
      setError(err.response?.data?.detail || 'Failed to fetch telemetry');
    } finally {
      setTelemetryLoading(false);
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
    // Format: show first part before dash and last 3 characters
    // e.g., "ut21b09485-0611821c-99957127" -> "ut21b09485-***127"
    // e.g., "Router-010000000000000001527F8B" -> "Router-***F8B"
    const dashIndex = deviceId.indexOf('-');
    if (dashIndex === -1) {
      // No dash, just show first 4 and last 3
      if (deviceId.length <= 7) return deviceId;
      return `${deviceId.substring(0, 4)}...${deviceId.slice(-3)}`;
    }
    
    const prefix = deviceId.substring(0, dashIndex);
    const last3 = deviceId.slice(-3);
    return `${prefix}-***${last3}`;
  };
  
  const handleAddAddress = async () => {
    setSelectedAddressId('');
    setShowAddressModal(true);
  };
  
  const handleConfirmAddAddress = async () => {
    if (!selectedAddressId || !serviceLineNumber) return;
    
    setAddressLoading(true);
    try {
      await addAddressToServiceLine(serviceLineNumber, selectedAddressId);
      setShowAddressModal(false);
      setSelectedAddressId('');
      // Refresh service line details and current address
      fetchServiceLineDetails();
      fetchCurrentAddress(selectedAddressId);
    } catch (err: any) {
      console.error('Failed to add address:', err);
      setError(err.response?.data?.detail || 'Failed to add address to service line');
    } finally {
      setAddressLoading(false);
    }
  };

  const fetchProductsAndMatch = async (productReferenceId: string) => {
    setLoadingProduct(true);
    try {
      const response = await getProducts();
      const productsArray = response?.content?.results || response?.content || [];
      
      if (Array.isArray(productsArray)) {
        const matchingProduct = productsArray.find(
          (p: any) => p.productReferenceId === productReferenceId || p.id === productReferenceId
        );
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
      
      // Fetch service line details, billing periods, user terminals, and addresses in parallel
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
      
      // Fetch current address if service line has one
      if (serviceLineResponse?.content?.addressReferenceId) {
        fetchCurrentAddress(serviceLineResponse.content.addressReferenceId);
      }
      
      // Fetch addresses list
      fetchAddresses();
      
      // Fetch telemetry for this service line
      fetchTelemetryForServiceLine();
      
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

        {/* Addresses Section */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text flex items-center gap-2">
                <FaMapMarkerAlt className="text-starlink-accent" />
                Address
              </h2>
              <p className="text-xs md:text-sm text-starlink-text-secondary mt-1">
                Address linked to this service line
              </p>
            </div>
          </div>
          
          {currentAddress ? (
            <div className="p-4 bg-starlink-light rounded border border-starlink-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAddress.formattedAddress && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Address</p>
                    <p className="text-sm text-starlink-text font-semibold">{currentAddress.formattedAddress}</p>
                  </div>
                )}
                {currentAddress.addressLines && currentAddress.addressLines.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Street Address</p>
                    <div className="space-y-1">
                      {currentAddress.addressLines.map((line, index) => (
                        <p key={index} className="text-sm text-starlink-text">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                {currentAddress.locality && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">City</p>
                    <p className="text-sm text-starlink-text">{currentAddress.locality}</p>
                  </div>
                )}
                {currentAddress.administrativeArea && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">State</p>
                    <p className="text-sm text-starlink-text">{currentAddress.administrativeArea}</p>
                  </div>
                )}
                {currentAddress.administrativeAreaCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">State Code</p>
                    <p className="text-sm text-starlink-text font-mono">{currentAddress.administrativeAreaCode}</p>
                  </div>
                )}
                {currentAddress.region && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Region</p>
                    <p className="text-sm text-starlink-text">{currentAddress.region}</p>
                  </div>
                )}
                {currentAddress.regionCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Region Code</p>
                    <p className="text-sm text-starlink-text font-mono">{currentAddress.regionCode}</p>
                  </div>
                )}
                {currentAddress.postalCode && (
                  <div>
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Postal Code</p>
                    <p className="text-sm text-starlink-text font-mono">{currentAddress.postalCode}</p>
                  </div>
                )}
                {currentAddress.latitude !== undefined && currentAddress.longitude !== undefined && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Coordinates</p>
                    <p className="text-sm text-starlink-text font-mono">
                      Lat: {currentAddress.latitude.toFixed(6)}, Lon: {currentAddress.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                {currentAddress.addressReferenceId && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-starlink-text-secondary uppercase mb-1">Address Reference ID</p>
                    <p className="text-xs text-starlink-text font-mono break-all">{currentAddress.addressReferenceId}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-starlink-light rounded border border-starlink-border text-center">
              <FaMapMarkerAlt className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary mb-3">
                No address is currently linked to this service line.
              </p>
              <button
                onClick={handleAddAddress}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FaPlus />
                Add Address
              </button>
            </div>
          )}
        </div>
        
        {/* Telemetry Section */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text flex items-center gap-2">
                <FaStream className="text-starlink-accent" />
                Device Telemetry
              </h2>
              <p className="text-xs md:text-sm text-starlink-text-secondary mt-1">
                Real-time telemetry for user terminals and routers on this service line
              </p>
            </div>
          </div>
          
          {telemetryLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-starlink-text-secondary">Loading telemetry data...</p>
            </div>
          ) : Object.keys(telemetryData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(telemetryData).map((device) => (
                <div 
                  key={device.deviceId}
                  className="card p-4 bg-starlink-gray border border-starlink-border hover:border-starlink-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1">
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
                        <h3 className="text-sm font-semibold text-starlink-text truncate" title={device.deviceId}>
                          {formatDeviceId(device.deviceId)}
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
                    {device.lastUpdate && (
                      <span className="text-[10px] text-starlink-text-secondary">
                        {new Date(device.lastUpdate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {/* User Terminal specific fields */}
                    {device.deviceType === 'User Terminal' && (
                      <>
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
                            <span className="text-sm font-semibold text-starlink-text">
                              {(() => {
                                const seconds = device.latestRecord.Uptime;
                                const days = Math.floor(seconds / 86400);
                                const hours = Math.floor((seconds % 86400) / 3600);
                                const minutes = Math.floor((seconds % 3600) / 60);
                                if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                                if (hours > 0) return `${hours}h ${minutes}m`;
                                return `${minutes}m`;
                              })()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Router specific fields */}
                    {device.deviceType === 'Router' && (
                      <>
                        {device.latestRecord.WifiUptimeS !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">⏰ Uptime</span>
                            <span className="text-sm font-semibold text-starlink-text">
                              {(() => {
                                const seconds = device.latestRecord.WifiUptimeS;
                                const days = Math.floor(seconds / 86400);
                                const hours = Math.floor((seconds % 86400) / 3600);
                                const minutes = Math.floor((seconds % 3600) / 60);
                                if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                                if (hours > 0) return `${hours}h ${minutes}m`;
                                return `${minutes}m`;
                              })()}
                            </span>
                          </div>
                        )}
                        {device.latestRecord.InternetPingLatencyMs !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">⏱ Internet Latency</span>
                            <span className={`text-sm font-bold ${
                              device.latestRecord.InternetPingLatencyMs < 50 ? 'text-green-400' :
                              device.latestRecord.InternetPingLatencyMs < 100 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{device.latestRecord.InternetPingLatencyMs} ms</span>
                          </div>
                        )}
                        {device.latestRecord.InternetPingDropRate !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">📉 Internet Drop</span>
                            <span className={`text-sm font-bold ${
                              device.latestRecord.InternetPingDropRate === 0 ? 'text-green-400' :
                              device.latestRecord.InternetPingDropRate < 0.01 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{(device.latestRecord.InternetPingDropRate * 100).toFixed(4)}%</span>
                          </div>
                        )}
                        {device.latestRecord.Clients !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">👥 Clients</span>
                            <span className="text-sm font-bold text-starlink-text">{device.latestRecord.Clients}</span>
                          </div>
                        )}
                        {device.latestRecord.WanRxBytes !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">↓ Downloaded</span>
                            <span className="text-sm font-semibold text-starlink-text">
                              {(device.latestRecord.WanRxBytes / 1073741824).toFixed(2)} GB
                            </span>
                          </div>
                        )}
                        {device.latestRecord.WanTxBytes !== undefined && (
                          <div className="flex items-center justify-between p-2 bg-starlink-light rounded">
                            <span className="text-xs text-starlink-text-secondary">↑ Uploaded</span>
                            <span className="text-sm font-semibold text-starlink-text">
                              {(device.latestRecord.WanTxBytes / 1073741824).toFixed(2)} GB
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FaStream className="text-4xl text-starlink-text-secondary mx-auto mb-3" />
              <p className="text-sm text-starlink-text-secondary">
                No telemetry data available for devices on this service line.
              </p>
            </div>
          )}
        </div>
        
        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-starlink-text">Add Address to Service Line</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-1 hover:bg-starlink-light rounded"
                >
                  <FaTimes className="text-starlink-text" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs text-starlink-text-secondary mb-2">
                  Select Address
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="">Select an address...</option>
                  {addresses.map((address) => (
                    <option key={address.addressReferenceId} value={address.addressReferenceId}>
                      {address.displayName || address.addressLine1 || address.addressReferenceId}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAddAddress}
                  disabled={!selectedAddressId || addressLoading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {addressLoading ? 'Adding...' : 'Add Address'}
                </button>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
