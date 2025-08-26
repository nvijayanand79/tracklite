import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'

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
    return !!authUtils.getToken()
  }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  
  // Get the intended destination (if redirected from protected route)
  const from = location.state?.from?.pathname || '/'
  
  // Redirect if already authenticated
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      navigate(from, { replace: true })
    }
  }, [navigate, from])
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null)
      
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })
      
      // Store the JWT token
      const { access_token } = response.data
      if (access_token) {
        authUtils.setToken(access_token)
        
        // Redirect to intended destination or dashboard
        navigate(from, { replace: true })
      } else {
        setServerError('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        setServerError('Invalid email or password')
      } else if (error.response?.status === 400) {
        setServerError('Please check your input and try again')
      } else {
        setServerError('Login failed. Please try again later.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Internal Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your TraceLite dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-600 text-sm">{serverError}</div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}