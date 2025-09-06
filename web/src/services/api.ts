import axios from 'axios'

// Dynamic API base URL detection
const getApiBaseUrl = () => {
  // Allow explicit override via Vite env
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL

  // Use same-origin relative path to avoid CORS when server is co-hosted
  return '/api'
}

const baseURL = getApiBaseUrl()

console.log('🔗 API Base URL:', baseURL)

export const api = axios.create({
  baseURL,
  // withCredentials: true,  // Disabled to avoid CORS preflight issues
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookie
    const getToken = () => {
      // Try to get from cookie first
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]
      
      if (cookieValue) return cookieValue
      
      // Check which page we're on to determine token priority
      const isOwnerPortal = window.location.pathname.includes('/owner')
      
      if (isOwnerPortal) {
        // On owner portal, only use owner token
        return localStorage.getItem('ownerToken')
      } else {
        // On admin portal, prefer admin token, fallback to owner token
        return localStorage.getItem('auth_token') || localStorage.getItem('ownerToken')
      }
    }

    const token = getToken()
    if (token) {
      console.log('API: Adding Authorization header with token:', token.substring(0, 20) + '...')
      console.log('API: Full token:', token)
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.log('API: No token found in localStorage or cookies')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data)
    
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Remove tokens and redirect to login
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      localStorage.removeItem('auth_token')
      localStorage.removeItem('ownerToken')
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/owner/track') {
        window.location.href = '/login'
      }
    }
    
    if (error.response?.status === 403) {
      console.log('403 Forbidden - Check user permissions or token validity')
    }
    
    return Promise.reject(error)
  }
)

// Reports API functions
export const reportsAPI = {
  // Create a new report
  create: (data: any) => api.post('/reports', data),
  
  // Get all reports with optional filters
  list: (params?: { final_status?: string; labtest_id?: string }) => 
    api.get('/reports', { params }),
  
  // Get a specific report
  get: (id: string) => api.get(`/reports/${id}`),
  
  // Update a report
  update: (id: string, data: any) => api.patch(`/reports/${id}`, data),
  
  // Approve a report
  approve: (id: string, approvedBy: string) => 
    api.post(`/reports/${id}/approve`, { approved_by: approvedBy })
}

// Invoices API functions
export const invoicesAPI = {
  // Create a new invoice
  create: (data: any) => api.post('/invoices', data),
  
  // Get all invoices with optional filters
  list: (params?: { status?: string; report_id?: string }) => 
    api.get('/invoices', { params }),
  
  // Get a specific invoice
  get: (id: string) => api.get(`/invoices/${id}`),
  
  // Update an invoice
  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data)
}

// Export the API instance with both names for compatibility
export const apiService = api
export default api