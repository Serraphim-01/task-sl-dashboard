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

export default api;
