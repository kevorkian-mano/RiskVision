import api from './api';

const announcementAPI = {
  // Get announcements for current user
  getAnnouncements: () => api.get('/announcements'),
  
  // Mark announcement as read
  markAsRead: (id) => api.post(`/announcements/${id}/read`),
  
  // Admin only endpoints
  getAllAnnouncements: () => api.get('/announcements/admin/all'),
  getStats: () => api.get('/announcements/admin/stats'),
  createAnnouncement: (data) => api.post('/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`)
};

export default announcementAPI; 