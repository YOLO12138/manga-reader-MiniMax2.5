import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  checkRegistrationAllowed: async () => {
    const response = await api.get('/api/auth/register-allowed');
    return response.data;
  },
};

// Manga API
export const mangaApi = {
  list: async () => {
    const response = await api.get('/api/manga');
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/api/manga/${id}`);
    return response.data;
  },

  create: async (title: string, description?: string) => {
    const response = await api.post('/api/manga', { title, description });
    return response.data;
  },

  update: async (id: number, data: { title?: string; description?: string; is_published?: boolean }) => {
    const response = await api.put(`/api/manga/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/api/manga/${id}`);
    return response.data;
  },

  getChapters: async (id: number) => {
    const response = await api.get(`/api/manga/${id}/chapters`);
    return response.data;
  },

  uploadChapter: async (
    mangaId: number,
    chapterNumber: number,
    chapterTitle: string | null,
    file: File
  ) => {
    const formData = new FormData();
    formData.append('chapter_number', chapterNumber.toString());
    if (chapterTitle) formData.append('chapter_title', chapterTitle);
    formData.append('file', file);

    const response = await api.post(`/api/manga/${mangaId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Chapter API
export const chapterApi = {
  getPages: async (chapterId: number) => {
    const response = await api.get(`/api/chapters/${chapterId}/pages`);
    return response.data;
  },

  getPageUrl: (chapterId: number, filename: string) => {
    return `${API_URL}/api/chapters/${chapterId}/pages/${filename}`;
  },
};

// Admin API
export const adminApi = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  createUser: async (data: { username: string; email: string; password: string; role?: string }) => {
    const response = await api.post('/api/admin/users', data);
    return response.data;
  },

  updateUser: async (userId: number, data: { role?: string; is_active?: boolean }) => {
    const response = await api.put(`/api/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  // Site Configuration
  getConfig: async () => {
    const response = await api.get('/api/admin/config');
    return response.data;
  },

  updateConfig: async (key: string, value: string) => {
    const response = await api.put('/api/admin/config', null, { params: { key, value } });
    return response.data;
  },

  getRegistrationStatus: async () => {
    const response = await api.get('/api/admin/config/registration');
    return response.data;
  },

  toggleRegistration: async (enabled: boolean) => {
    const response = await api.put('/api/admin/config/registration', null, { params: { enabled } });
    return response.data;
  },
};

export default api;
