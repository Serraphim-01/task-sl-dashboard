import axios from 'axios';

// Declare process for Create React App environment variables
declare const process: {
  env: {
    REACT_APP_API_URL: string;
  };
};

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

// Create customer (admin only) - No password required, user will set on first login
export const createCustomer = async (customerData: {
  email: string;
  enterprise_name: string;
  starlink_client_id: string;
  starlink_client_secret: string;
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

// Get customer Starlink telemetry
export const getCustomerTelemetry = async () => {
  const response = await api.get('/customer/starlink/telemetry');
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

// Get all service lines (admin only)
export const getServiceLines = async (params?: {
  addressReferenceId?: string;
  searchString?: string;
  dataPoolId?: string;
  page?: number;
  orderByCreatedDateDescending?: boolean;
}) => {
  const response = await api.get('/admin/service-lines', { params });
  return response.data;
};

// Get specific service line details (admin only)
export const getServiceLine = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}`);
  return response.data;
};

// Get billing partial periods for a service line (admin only)
export const getBillingPartialPeriods = async (serviceLineNumber: string) => {
  const response = await api.get(`/admin/service-lines/${serviceLineNumber}/billing-partial-periods`);
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

export default api;
