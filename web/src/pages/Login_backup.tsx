import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/ui';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">TL</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              TraceLite
            </span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to access your TraceLite dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 backdrop-blur-lg bg-white/95 border-white/20 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm font-medium">{serverError}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Email:</strong> admin@tracelite.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>

          {/* Public Links */}
          <div className="mt-6 text-center">
            <Link 
              to="/owner/track" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              🔍 Track an Order (Public)
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            TraceLite Enterprise • Laboratory Management System
          </p>
        </div>
      </div>
    </div>
  )
}