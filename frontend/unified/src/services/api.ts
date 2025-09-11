import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          toast.error('Session expired. Please login again.')
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action.')
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config)
    return response.data
  }
}

export const apiService = new ApiService()

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) => 
    apiService.post('/auth/login', data),
  
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiService.post('/auth/register', data),
  
  logout: () => apiService.post('/auth/logout'),
  
  getProfile: () => apiService.get('/auth/profile'),
  
  updateProfile: (data: any) => apiService.put('/auth/profile', data),
  
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiService.post('/auth/change-password', data),
}

// Products API
export const productsAPI = {
  getAll: (params?: any) => apiService.get('/products', { params }),
  
  getById: (id: string) => apiService.get(`/products/${id}`),
  
  create: (data: any) => apiService.post('/products', data),
  
  update: (id: string, data: any) => apiService.put(`/products/${id}`, data),
  
  delete: (id: string) => apiService.delete(`/products/${id}`),
  
  search: (query: string) => apiService.get('/products/search', { params: { q: query } }),
}

// Orders API
export const ordersAPI = {
  getAll: (params?: any) => apiService.get('/orders', { params }),
  
  getById: (id: string) => apiService.get(`/orders/${id}`),
  
  create: (data: any) => apiService.post('/orders', data),
  
  updateStatus: (id: string, status: string) => 
    apiService.patch(`/orders/${id}/status`, { status }),
  
  cancel: (id: string) => apiService.post(`/orders/${id}/cancel`),
  
  getMyOrders: () => apiService.get('/orders/my-orders'),
}

// Inventory API
export const inventoryAPI = {
  getAll: (params?: any) => apiService.get('/inventory', { params }),
  
  adjust: (data: any) => apiService.post('/inventory/adjust', data),
  
  transfer: (data: any) => apiService.post('/inventory/transfer', data),
  
  getLowStock: () => apiService.get('/inventory/low-stock'),
  
  getReport: (params?: any) => apiService.get('/inventory/report', { params }),
}

export default apiService