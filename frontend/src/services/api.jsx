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
  sendEmail: (emailData) => api.post('/users/send-email', emailData),
};

// User API (alias for authAPI for consistency)
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (userId) => api.get(`/users/${userId}`),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  delete: (userId) => api.delete(`/users/${userId}`),
};

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getByUser: (userId) => api.get(`/transactions/user/${userId}`),
  create: (transaction) => api.post('/transactions', transaction),
  getStats: () => api.get('/transactions/stats'),
  delete: (transactionId) => api.delete(`/transactions/${transactionId}`),
  deleteOld: (keepCount = 20) => api.delete('/transactions/cleanup/old', { data: { keepCount } }),
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
  getStats: () => api.get('/cases/stats'),
  createFromTransaction: (caseData) => api.post('/cases/from-transaction', caseData),
  createFromAlert: (caseData) => api.post('/cases/from-alert', caseData),
  assignInvestigator: (id, investigatorId) => 
    api.put(`/cases/${id}/assign`, { investigatorId }),
  assignToSelf: (id) => api.put(`/cases/${id}/assign-self`),
  getInvestigators: () => api.get('/users/by-role/investigator'),
  updateStatus: (id, status, notes) => api.put(`/cases/${id}/status`, { status, notes }),
  addComment: (id, text) => api.post(`/cases/${id}/comment`, { text }),
  uploadEvidence: (id, evidence) => api.post(`/cases/${id}/evidence`, evidence),
  closeCase: (id, resolution) => api.put(`/cases/${id}/close`, { resolution }),
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