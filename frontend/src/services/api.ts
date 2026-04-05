import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',  // FastAPI backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Include cookies in requests
});

// Add request interceptor to include JWT token in Authorization header
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Customer login
export const loginCustomer = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Create customer (admin only)
export const createCustomer = async (customerData: {
  email: string;
  enterprise_name: string;
  starlink_client_id: string;
  starlink_client_secret: string;
  password: string;
  confirm_password: string;
}) => {
  const response = await api.post('/admin/customers', customerData);
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

// Admin login (same endpoint as customer, role determined by backend)
export const loginAdmin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
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
  Cookies.remove('access_token');
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

export default api;
