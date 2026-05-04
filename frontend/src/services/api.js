import axios from 'axios';

const api = axios.create({
  // Use /api as default for Vercel monorepo rewrite compatibility
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Subcategories
  createSubcategory: (data) => api.post('/admin/subcategories', data),
  updateSubcategory: (id, data) => api.put(`/admin/subcategories/${id}`, data),
  deleteSubcategory: (id) => api.delete(`/admin/subcategories/${id}`),

  // Sections
  createSection: (data) => api.post('/admin/sections', data),
  updateSection: (id, data) => api.put(`/admin/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/admin/sections/${id}`),

  // Tests
  getTests: (params) => api.get('/admin/tests', { params }),
  getTest: (id) => api.get(`/admin/tests/${id}`),
  createTest: (data) => api.post('/admin/tests', data),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),
  duplicateTest: (id) => api.post(`/admin/tests/${id}/duplicate`),

  // Questions
  addQuestions: (testId, questions) => api.post(`/admin/tests/${testId}/questions`, { questions }),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  // Analytics
  getTestAnalytics: (testId) => api.get(`/admin/analytics/tests/${testId}`),
  getGlobalAnalytics: () => api.get('/admin/analytics/global'),

  // Comments
  getComments: () => api.get('/admin/comments'),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),

  // Feedback
  getFeedback: () => api.get('/admin/feedback'),
  markFeedbackRead: (id) => api.patch(`/admin/feedback/${id}/read`),

  // Audit Logs
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

// ─── Student ─────────────────────────────────────────────────────────────────
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),

  getTests: (params) => api.get('/student/tests', { params }),
  getTest: (id) => api.get(`/student/tests/${id}`),

  startTest: (testId) => api.post(`/student/tests/${testId}/start`),
  saveProgress: (attemptId, responses) =>
    api.post(`/student/attempts/${attemptId}/save`, { responses }),
  submitTest: (attemptId, data) => api.post(`/student/attempts/${attemptId}/submit`, data),
  getResult: (attemptId) => api.get(`/student/attempts/${attemptId}/result`),

  getHistory: (params) => api.get('/student/history', { params }),
  getAnalytics: () => api.get('/student/analytics'),

  getComments: (testId) => api.get(`/student/tests/${testId}/comments`),
  postComment: (testId, content) => api.post(`/student/tests/${testId}/comments`, { content }),
  toggleLike: (testId) => api.post(`/student/tests/${testId}/like`),
  submitFeedback: (data) => api.post('/student/feedback', data),
};

// ─── Public ──────────────────────────────────────────────────────────────────
export const publicAPI = {
  getCategories: () => api.get('/categories'),
  getStats: () => api.get('/stats'),
  uploadImage: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// OCR
export const ocrAPI = {
  extract: (formData) => api.post('/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
