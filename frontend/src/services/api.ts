import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',  // FastAPI backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAccountDetails = async () => {
  const response = await api.get('/account');
  return response.data;
};

export default api;
