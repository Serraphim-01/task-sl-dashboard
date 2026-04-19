import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// No need for request interceptor - backend reads HTTP-only cookie automatically

// Admin login (separate endpoint for admin users)
export const loginAdmin = async (email: string, password: string) => {
  const response = await api.post('/auth/admin/login', { email, password });
  return response.data;
};

// Customer login
export const loginCustomer = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Create customer (admin only) - Requires service line number instead of credentials
export const createCustomer = async (customerData: {
  email: string;
  enterprise_name: string;
  service_line_number: string;
}) => {
  const response = await api.post('/admin/customers', customerData);
  return response.data;
};

// Change password (for authenticated users)
export const changePassword = async (passwordData: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.post('/auth/change-password', passwordData);
  return response.data;
};

// Check forgot password status (public endpoint)
export const checkForgotPasswordStatus = async (email: string) => {
  const response = await api.post('/auth/forgot-password/status', { email });
  return response.data;
};

// Reset password via forgot password flow (public endpoint)
export const resetForgotPassword = async (email: string, newPassword: string, confirmPassword: string) => {
  const response = await api.post('/auth/forgot-password/reset', {
    email,
    new_password: newPassword,
    confirm_password: confirmPassword
  });
  return response.data;
};

// Get WebSocket token for real-time updates
export const getWebSocketToken = async () => {
  const response = await api.get('/auth/ws-token');
  return response.data;
};

// Get customer Starlink account info
export const getCustomerAccount = async () => {
  const response = await api.get('/customer/starlink/account');
  return response.data;
};

// Logout
export const logout = async () => {
  // Backend logout endpoint if exists, else just clear token
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // Ignore if no logout endpoint
  }
};

// Get current user info
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// List all users (admin only)
export const listUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Delete user (admin only)
export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// ==================== CUSTOMER API ENDPOINTS (Customer Portal) ====================

// Customer Service Line endpoints (no admin required)
export const getCustomerServiceLine = async () => {
  const response = await api.get('/customer/service-line');
  return response.data;
};

export const getCustomerCurrentPlan = async () => {
  const response = await api.get('/customer/service-line/current-plan');
  return response.data;
};

export const getCustomerUserTerminals = async () => {
  const response = await api.get('/customer/service-line/user-terminals');
  return response.data;
};

export const getCustomerTelemetry = async () => {
  const response = await api.get('/customer/service-line/telemetry');
  return response.data;
};

export const getCustomerProducts = async () => {
  const response = await api.get('/customer/products');
  return response.data;
};

export const getCustomerAddress = async (addressReferenceId: string) => {
  const response = await api.get(`/customer/addresses/${addressReferenceId}`);
  return response.data;
};

// Customer User Terminal and Router endpoints (no admin required)
export const getCustomerUserTerminalDetails = async (userTerminalId: string) => {
  const response = await api.get(`/customer/starlink/user-terminals/${userTerminalId}`);
  return response.data;
};

export const getCustomerRouterDetails = async (routerId: string) => {
  const response = await api.get(`/customer/starlink/routers/${routerId}`);
  return response.data;
};

export const getCustomerRouterConfig = async (configId: string) => {
  const response = await api.get(`/customer/starlink/routers/configs/${configId}`);
  return response.data;
};

// ==================== STARLINK V2 API ENDPOINTS (Customer - Read Only) ====================

// Account endpoints
export const getAccountInfo = async () => {
  const response = await api.get('/customer/starlink/account');
  return response.data;
};

export const getAccountUsers = async () => {
  const response = await api.get('/customer/starlink/account/users');
  return response.data;
};

// Device endpoints
export const listDevices = async () => {
  const response = await api.get('/customer/starlink/devices');
  return response.data;
};

export const getDevice = async (deviceId: string) => {
  const response = await api.get(`/customer/starlink/devices/${deviceId}`);
  return response.data;
};

export const getDeviceStatus = async (deviceId: string) => {
  const response = await api.get(`/customer/starlink/devices/${deviceId}/status`);
  return response.data;
};

export const getDeviceLocation = async (deviceId: string) => {
  const response = await api.get(`/customer/starlink/devices/${deviceId}/location`);
  return response.data;
};

export const getDeviceDiagnostics = async (deviceId: string) => {
  const response = await api.get(`/customer/starlink/devices/${deviceId}/diagnostics`);
  return response.data;
};

// Telemetry & Statistics
export const getTelemetry = async (deviceId?: string) => {
  const params = deviceId ? { deviceId } : {};
  const response = await api.get('/customer/starlink/telemetry', { params });
  return response.data;
};

// Telemetry Stream
export const getTelemetryStream = async (batchSize?: number, maxLingerMs?: number) => {
  const body: any = {};
  if (batchSize !== undefined) body.batchSize = batchSize;
  if (maxLingerMs !== undefined) body.maxLingerMs = maxLingerMs;
  const response = await api.post('/customer/starlink/telemetry/stream', body);
  return response.data;
};

// Service Line Telemetry (fetch once, not stream)
export const getServiceLineTelemetry = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}/telemetry`);
  return response.data;
};

export const getStatistics = async (deviceId?: string, startTime?: string, endTime?: string) => {
  const params: any = {};
  if (deviceId) params.deviceId = deviceId;
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;
  const response = await api.get('/customer/starlink/statistics', { params });
  return response.data;
};

// Tasks (View Only)
export const listTasks = async (deviceId?: string) => {
  const params = deviceId ? { deviceId } : {};
  const response = await api.get('/customer/starlink/tasks', { params });
  return response.data;
};

export const getTask = async (taskId: string) => {
  const response = await api.get(`/customer/starlink/tasks/${taskId}`);
  return response.data;
};

// Network Configuration (View Only)
export const getNetworkConfig = async (deviceId: string) => {
  const response = await api.get(`/customer/starlink/network/config/${deviceId}`);
  return response.data;
};

// Alerts (View Only)
export const getAlerts = async (deviceId?: string) => {
  const params = deviceId ? { deviceId } : {};
  const response = await api.get('/customer/starlink/alerts', { params });
  return response.data;
};

// ==================== ADMIN API ENDPOINTS ====================

// Service Lines
export const getServiceLines = async (params?: {
  address_reference_id?: string;
  search_string?: string;
  data_pool_id?: string;
  page?: number;
  order_by_created_date_descending?: boolean;
}) => {
  const response = await api.get('/admin/service-lines', { params });
  return response.data;
};

export const getServiceLine = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}`);
  return response.data;
};

export const getBillingPartialPeriods = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}/billing-partial-periods`);
  return response.data;
};

export const getUserTerminals = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}/user-terminals`);
  return response.data;
};

export const getUserTerminalDetails = async (userTerminalId: string) => {
  const response = await api.get(`/admin/user-terminals/${userTerminalId}`);
  return response.data;
};

export const getRouterDetails = async (routerId: string) => {
  const response = await api.get(`/admin/routers/${routerId}`);
  return response.data;
};

export const getRouterConfig = async (configId: string) => {
  const response = await api.get(`/admin/routers/configs/${configId}`);
  return response.data;
};

export const getDefaultRouterConfig = async () => {
  const response = await api.get('/admin/routers/configs/default');
  return response.data;
};

export const getRouterLocalContent = async () => {
  const response = await api.get('/admin/routers/local-content');
  return response.data;
};

export const getSandboxClients = async () => {
  const response = await api.get('/admin/routers/sandbox/clients');
  return response.data;
};

export const getTlsConfigs = async () => {
  const response = await api.get('/admin/routers/configs/tls');
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get('/admin/products');
  return response.data;
};

export const getProduct = async (productReferenceId: string) => {
  const response = await api.get(`/admin/products/${productReferenceId}`);
  return response.data;
};

// Addresses
export const getAddresses = async () => {
  const response = await api.get('/admin/addresses');
  return response.data;
};

export const getAddress = async (addressReferenceId: string) => {
  const response = await api.get(`/admin/addresses/${addressReferenceId}`);
  return response.data;
};

// Service Line Address Management
export const addAddressToServiceLine = async (serviceLineNumber: string, addressReferenceId: string) => {
  const response = await api.post(`/admin/service-lines/${serviceLineNumber}/addresses`, { address_reference_id: addressReferenceId });
  return response.data;
};

export const removeAddressFromServiceLine = async (serviceLineNumber: string, addressReferenceId: string) => {
  const response = await api.delete(`/admin/service-lines/${serviceLineNumber}/addresses/${addressReferenceId}`);
  return response.data;
};

// ==================== KMS/AZURE KEY VAULT MANAGEMENT ====================

export const getKMSStatus = async () => {
  const response = await api.get('/admin/settings/kms/status');
  return response.data;
};

export const listKMSSecrets = async () => {
  const response = await api.get('/admin/settings/kms/secrets');
  return response.data;
};

export const updateStarlinkCredentials = async (data: {
  client_id_secret_name: string;
  client_id_value: string;
  client_secret_secret_name: string;
  client_secret_value: string;
}) => {
  const response = await api.post('/admin/settings/kms/credentials', data);
  return response.data;
};

export const deleteKMSSecret = async (secretName: string) => {
  const response = await api.delete(`/admin/settings/kms/secrets/${secretName}`);
  return response.data;
};

export default api;
