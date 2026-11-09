import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => api.put(`/projects/${id}/members/${userId}/role`, { role }),
  getActivity: (id) => api.get(`/projects/${id}/activity`),
  getBoard: (id) => api.get(`/projects/${id}/board`),
  createColumn: (id, data) => api.post(`/projects/${id}/columns`, data),
  updateColumn: (projectId, colId, data) => api.put(`/projects/${projectId}/columns/${colId}`, data),
  deleteColumn: (projectId, colId) => api.delete(`/projects/${projectId}/columns/${colId}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  move: (id, data) => api.put(`/tasks/${id}/move`, data),
  getDashboardStats: () => api.get('/tasks/dashboard-stats'),
  getComments: (id) => api.get(`/tasks/${id}/comments`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsAPI = {
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};
