import api from './api';

const pointsAPI = {
  // Get current user's points
  getMyPoints: () => api.get('/points/my-points'),
  
  // Get leaderboard
  getLeaderboard: (role = null) => api.get('/points/leaderboard', { params: { role } }),
  
  // Admin only endpoints
  getPointsStats: () => api.get('/points/stats'),
  getUserPoints: (userId) => api.get(`/points/user/${userId}`),
  awardPoints: (data) => api.post('/points/award', data),
  
  // New admin endpoints for comprehensive points management
  getAllUsersPoints: () => api.get('/points/all-users'),
  awardBonusPoints: (data) => api.post('/points/bonus', data),
  getPointsHistory: (userId) => api.get(`/points/history/${userId}`)
};

export default pointsAPI; 