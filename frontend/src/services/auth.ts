import api from './api';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};