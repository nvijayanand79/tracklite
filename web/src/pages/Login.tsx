import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

// Auth utilities
const AUTH_TOKEN_KEY = 'auth_token'

export const authUtils = {
  // Store JWT token
  setToken: (token: string) => {
    // Try to set httpOnly cookie first (if backend supports it)
    document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; secure; samesite=strict`
    // Fallback to localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  },
  
  // Get JWT token
  getToken: (): string | null => {
    // Try to get from cookie first
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${AUTH_TOKEN_KEY}=`))
      ?.split('=')[1]
    
    if (cookieValue) return cookieValue
    
    // Fallback to localStorage
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },
  
  // Remove JWT token
  removeToken: () => {
    // Remove from cookie
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    // Remove from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return authUtils.getToken() !== null
  }
}

// Set up API interceptor for authentication
api.interceptors.request.use((config) => {
  const token = authUtils.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authUtils.removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Check if already authenticated
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [navigate, location])

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔐 Login attempt:', { email: data.email, password: '***' })
      console.log('🔗 API Base URL:', (api as any).defaults.baseURL)
      
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })
      
      console.log('✅ Login response:', response.data)
      
      const { access_token } = response.data
      
      if (access_token) {
        console.log('✅ Token received, storing:', access_token.substring(0, 20) + '...')
        authUtils.setToken(access_token)
        
        // Redirect to intended page or dashboard
        const from = (location.state as any)?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        console.error('❌ No token in response')
        setError('Login failed: No token received')
      }
    } catch (err: any) {
      console.error('❌ Login error:', err)
      console.error('❌ Error response:', err.response)
      console.error('❌ Error data:', err.response?.data)
      console.error('❌ Error status:', err.response?.status)
      
      if (err.response?.status === 401) {
        setError('Invalid email or password')
      } else {
        setError(err.response?.data?.detail || err.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">TraceLite</h1>
          <p className="text-gray-600 text-sm">Laboratory Sample Management</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-sm">Authentication Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={`form-input pl-10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  {...register('password')}
                  className={`form-input pl-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-4 text-center border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2024 TraceLite. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
