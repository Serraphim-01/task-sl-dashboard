import React, { useState, useEffect } from 'react';
import { getServicePlan } from '../services/api.ts';

interface DataBlock {
  productId: string;
  startDate: string;
  expirationDate: string;
  count: number;
  dataAmount: number;
  dataUnitType: string;
}

interface AviationMetadata {
  tailNumber?: string;
  seatCount?: number;
  airlineIataCode?: string;
  aircraftIataCode?: string;
  airlineIcaoCode?: string;
  aircraftIcaoCode?: string;
  stcNumber?: string;
}

interface ServiceLine {
  addressReferenceId?: string;
  serviceLineNumber: string;
  nickname?: string;
  productReferenceId?: string;
  delayedProductId?: string;
  optInProductId?: string;
  startDate: string;
  endDate?: string;
  publicIp?: boolean;
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

interface ServicePlanContent {
  pageIndex: number;
  limit: number;
  isLastPage: boolean;
  results: ServiceLine[];
  totalCount: number;
}

interface ServicePlanData {
  errors?: any[];
  warnings?: any[];
  information?: string[];
  isValid: boolean;
  content: ServicePlanContent;
}

const ServicePlan: React.FC = () => {
  const [data, setData] = useState<ServicePlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicePlan = async () => {
      try {
        const responseData = await getServicePlan();
        setData(responseData);
      } catch (err: any) {
        setError(err.message || 'Failed to load service plan information');
      } finally {
        setLoading(false);
      }
    };
    fetchServicePlan();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Loading service plan...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Service Plan</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  if (!data || !data.content || data.content.results.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Service Plan</h2>
        <p>No service lines found. {data?.isValid === false && 'Invalid response.'}</p>
      </div>
    );
  }

  const { content } = data;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Service Lines ({content.totalCount} total)</h2>
      <p>Page {content.pageIndex + 1} of {content.isLastPage ? 1 : 'multiple'}</p>
      {content.results.map((line) => (
        <div
          key={line.serviceLineNumber || line.addressReferenceId}
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1rem',
            borderLeft: `4px solid ${line.active ? '#4CAF50' : '#f44336'}`,
          }}
        >
          <h3>Service Line: {line.serviceLineNumber || line.addressReferenceId}</h3>
          <p><strong>Status:</strong> <span style={{ color: line.active ? 'green' : 'red' }}>{line.active ? 'Active' : 'Inactive'}</span></p>
          <p><strong>Nickname:</strong> {line.nickname || '—'}</p>
          <p><strong>Start Date:</strong> {new Date(line.startDate).toLocaleDateString()}</p>
          {line.endDate && <p><strong>End Date:</strong> {new Date(line.endDate).toLocaleDateString()}</p>}
          {line.publicIp !== undefined && <p><strong>Public IP:</strong> {line.publicIp ? 'Yes' : 'No'}</p>}
          
          {line.aviationMetadata && (
            <details>
              <summary>Aviation Metadata</summary>
              <p><strong>Tail Number:</strong> {line.aviationMetadata.tailNumber || '—'}</p>
              <p><strong>Seats:</strong> {line.aviationMetadata.seatCount || '—'}</p>
              <p><strong>Airline IATA:</strong> {line.aviationMetadata.airlineIataCode || '—'}</p>
            </details>
          )}

          {line.dataBlocks && Object.keys(line.dataBlocks).length > 0 && (
            <details>
              <summary>Data Blocks (Current Cycle)</summary>
              <ul>
                {line.dataBlocks.recurringBlocksCurrentBillingCycle?.map((block, i) => (
                  <li key={i}>
                    {block.count} x {block.dataAmount} {block.dataUnitType} ({block.productId})
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServicePlan;
