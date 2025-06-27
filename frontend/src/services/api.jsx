import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  getCurrentUser: () => api.get('/users/me'),
  register: (userData) => api.post('/users/register', userData),
  getAllUsers: () => api.get('/users'),
  updateUserRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getByUser: (userId) => api.get(`/transactions/user/${userId}`),
  create: (transaction) => api.post('/transactions', transaction),
  getStats: () => api.get('/transactions/stats'),
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
  getStats: () => api.get('/alerts/stats'),
};

// Case API
export const caseAPI = {
  getAll: () => api.get('/cases'),
  getById: (id) => api.get(`/cases/${id}`),
  create: (caseData) => api.post('/cases', caseData),
  assignInvestigator: (id, investigatorId) => 
    api.put(`/cases/${id}/assign`, { investigatorId }),
  updateStatus: (id, status) => api.put(`/cases/${id}/status`, { status }),
  addComment: (id, text) => api.post(`/cases/${id}/comment`, { text }),
  uploadEvidence: (id, evidence) => api.post(`/cases/${id}/evidence`, evidence),
  close: (id) => api.put(`/cases/${id}/close`),
  delete: (id) => api.delete(`/cases/${id}`),
};

// Log API
export const logAPI = {
  getAll: (params) => api.get('/logs', { params }),
  filter: (params) => api.get('/logs/filter', { params }),
  export: (params) => api.get('/logs/export', { params }),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/rules'),
  create: (rule) => api.post('/rules', rule),
  update: (id, updates) => api.put(`/rules/${id}`, updates),
  delete: (id) => api.delete(`/rules/${id}`),
};

// Health check API
export const healthAPI = {
  check: () => axios.get('http://localhost:5000/health'),
  getInfo: () => axios.get('http://localhost:5000/api-info'),
};

export default api; 