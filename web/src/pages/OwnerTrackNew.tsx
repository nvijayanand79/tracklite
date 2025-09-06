import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

// Types
interface TimelineStep {
  step: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  description?: string;
}

interface TrackingResult {
  found: boolean;
  type?: string;
  id?: string;
  current_step?: string;
  timeline: TimelineStep[];
  documents: Array<{
    type: string;
    id: string;
    name: string;
    status: string;
    download_available: boolean;
  }>;
}

interface Document {
  id: string;
  name: string;
  status: string;
  created_at: string;
  approved_by?: string;
  amount?: number;
  paid_at?: string;
}

interface OwnerDocuments {
  reports: Document[];
  invoices: Document[];
}

// Schemas
const trackingSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
});

const preferencesSchema = z.object({
  owner_email: z.string().email('Invalid email'),
  owner_phone: z.string().optional(),
  email_notifications: z.boolean(),
  whatsapp_notifications: z.boolean(),
  sms_notifications: z.boolean(),
});

const otpInitSchema = z.object({
  email: z.string().email('Invalid email'),
});

const otpVerifySchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

type TrackingForm = z.infer<typeof trackingSchema>;
type PreferencesForm = z.infer<typeof preferencesSchema>;
type OTPInitForm = z.infer<typeof otpInitSchema>;
type OTPVerifyForm = z.infer<typeof otpVerifySchema>;

const OwnerTrack: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'track' | 'documents' | 'notifications' | 'login'>('track');
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [documents, setDocuments] = useState<OwnerDocuments>({ reports: [], invoices: [] });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Forms
  const trackingForm = useForm<TrackingForm>({
    resolver: zodResolver(trackingSchema),
    defaultValues: { query: '' }
  });

  const preferencesForm = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      owner_email: '',
      owner_phone: '',
      email_notifications: true,
      whatsapp_notifications: false,
      sms_notifications: false,
    }
  });

  const otpInitForm = useForm<OTPInitForm>({
    resolver: zodResolver(otpInitSchema),
    defaultValues: { email: '' }
  });

  const otpVerifyForm = useForm<OTPVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: '', code: '' }
  });

  // Tab configuration
  const tabs = [
    { id: 'track', label: 'Track Samples', icon: 'search' },
    { id: 'login', label: isAuthenticated ? 'Account' : 'Login', icon: 'user' },
    ...(isAuthenticated ? [
      { id: 'documents', label: 'My Documents', icon: 'document' },
      { id: 'notifications', label: 'Preferences', icon: 'settings' }
    ] : [])
  ];

  const getTabIcon = (iconType: string) => {
    const icons = {
      search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    };
    return icons[iconType as keyof typeof icons] || icons.search;
  };

  // Tracking functionality
  const handleTrackingSubmit = async (data: TrackingForm) => {
    try {
      setLoading(true);
      setError(null);
      setTrackingResult(null);

      const response = await api.get(`/owner/track/${data.query}`);
      setTrackingResult(response.data);
    } catch (err: any) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.detail || 'Failed to track sample');
    } finally {
      setLoading(false);
    }
  };

  // OTP Authentication
  const handleOTPInit = async (data: OTPInitForm) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await api.post('/owner/auth/request-otp', { email: data.email });
      setOtpSent(true);
      setCurrentEmail(data.email);
      setMessage('OTP sent to your email. Please check your inbox.');
      
      // Set email in verify form
      otpVerifyForm.setValue('email', data.email);
    } catch (err: any) {
      console.error('OTP init error:', err);
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (data: OTPVerifyForm) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await api.post('/owner/auth/verify-otp', data);
      
      if (response.data.access_token) {
        setIsAuthenticated(true);
        setActiveTab('documents');
        setMessage('Successfully logged in!');
        
        // Store token
        localStorage.setItem('owner_token', response.data.access_token);
        
        // Load user documents
        await loadDocuments();
        await loadPreferences();
      }
    } catch (err: any) {
      console.error('OTP verify error:', err);
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Load documents and preferences
  const loadDocuments = async () => {
    try {
      const [reportsRes, invoicesRes] = await Promise.all([
        api.get('/owner/reports'),
        api.get('/owner/invoices')
      ]);
      
      setDocuments({
        reports: reportsRes.data,
        invoices: invoicesRes.data
      });
    } catch (err: any) {
      console.error('Error loading documents:', err);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get('/owner/preferences');
      preferencesForm.reset(response.data);
    } catch (err: any) {
      console.error('Error loading preferences:', err);
    }
  };

  const handlePreferencesSubmit = async (data: PreferencesForm) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await api.post('/owner/preferences', data);
      setMessage('Preferences updated successfully!');
    } catch (err: any) {
      console.error('Preferences error:', err);
      setError(err.response?.data?.detail || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('track');
    setOtpSent(false);
    setCurrentEmail('');
    localStorage.removeItem('owner_token');
    
    // Reset forms
    otpInitForm.reset();
    otpVerifyForm.reset();
    preferencesForm.reset();
  };

  // Check for existing authentication on load
  useEffect(() => {
    const token = localStorage.getItem('owner_token');
    if (token) {
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      loadDocuments();
      loadPreferences();
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'COMPLETED': 'badge-success',
      'PENDING': 'badge-warning',
      'DRAFT': 'badge-secondary',
      'PAID': 'badge-success',
      'UNPAID': 'badge-danger',
      'OVERDUE': 'badge-danger'
    };
    return statusMap[status as keyof typeof statusMap] || 'badge-secondary';
  };

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 p-6">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="page-header">
            <div className="text-center">
              <h1 className="page-title">Sample Owner Portal</h1>
              <p className="page-subtitle">Track your samples, view reports, and manage preferences</p>
            </div>
          </div>

          {/* Global Messages */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-800 animate-slide-up">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-danger-600 hover:text-danger-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl text-success-800 animate-slide-up">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Success</p>
                    <p className="text-sm mt-1">{message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMessage(null)}
                  className="text-success-600 hover:text-success-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="card p-2 mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getTabIcon(tab.icon)}
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="card">
            {/* Track Samples Tab */}
            {activeTab === 'track' && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-2">Track Your Samples</h2>
                  <p className="text-secondary-600">Enter your tracking number or AWB number to get real-time status updates</p>
                </div>

                <form onSubmit={trackingForm.handleSubmit(handleTrackingSubmit)} className="max-w-2xl mx-auto">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        {...trackingForm.register('query')}
                        className="input-field text-lg"
                        placeholder="Enter tracking number, AWB number, or sample ID..."
                      />
                      {trackingForm.formState.errors.query && (
                        <p className="mt-2 text-sm text-danger-600 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {trackingForm.formState.errors.query.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary px-8"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Track
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Tracking Results */}
                {trackingResult && (
                  <div className="mt-8 max-w-4xl mx-auto">
                    {trackingResult.found ? (
                      <div className="space-y-6">
                        {/* Status Overview */}
                        <div className="bg-success-50 border border-success-200 rounded-xl p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-success-900">Sample Found!</h3>
                              <p className="text-success-700">
                                Type: <span className="font-medium">{trackingResult.type}</span> • 
                                Current Status: <span className="font-medium">{trackingResult.current_step}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white border border-secondary-200 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-secondary-900 mb-6">Progress Timeline</h4>
                          <div className="space-y-4">
                            {trackingResult.timeline.map((step, index) => (
                              <div key={index} className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  step.status === 'completed' ? 'bg-success-100 text-success-600' :
                                  step.status === 'current' ? 'bg-info-100 text-info-600' :
                                  'bg-secondary-100 text-secondary-400'
                                }`}>
                                  {step.status === 'completed' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : step.status === 'current' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h5 className={`font-medium ${
                                    step.status === 'completed' ? 'text-success-900' :
                                    step.status === 'current' ? 'text-info-900' :
                                    'text-secondary-600'
                                  }`}>
                                    {step.step}
                                  </h5>
                                  {step.description && (
                                    <p className="text-sm text-secondary-600 mt-1">{step.description}</p>
                                  )}
                                  {step.timestamp && (
                                    <p className="text-xs text-secondary-500 mt-1">{step.timestamp}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Available Documents */}
                        {trackingResult.documents && trackingResult.documents.length > 0 && (
                          <div className="bg-white border border-secondary-200 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-secondary-900 mb-4">Available Documents</h4>
                            <div className="space-y-3">
                              {trackingResult.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                      <p className="font-medium text-secondary-900">{doc.name}</p>
                                      <p className="text-sm text-secondary-600">{doc.type}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`badge ${getStatusBadge(doc.status)}`}>
                                      {doc.status}
                                    </span>
                                    {doc.download_available && (
                                      <button className="btn-secondary btn-sm">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-warning-50 border border-warning-200 rounded-xl p-8 text-center">
                        <svg className="w-16 h-16 text-warning-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-warning-900 mb-2">Sample Not Found</h3>
                        <p className="text-warning-700">No sample found with the provided tracking information. Please check your tracking number and try again.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Login Tab */}
            {activeTab === 'login' && (
              <div className="p-8">
                {!isAuthenticated ? (
                  <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                        {otpSent ? 'Verify Your Email' : 'Access Your Account'}
                      </h2>
                      <p className="text-secondary-600">
                        {otpSent 
                          ? 'Enter the 6-digit code sent to your email' 
                          : 'We\'ll send a secure code to your registered email'
                        }
                      </p>
                    </div>

                    {!otpSent ? (
                      <form onSubmit={otpInitForm.handleSubmit(handleOTPInit)} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            {...otpInitForm.register('email')}
                            className="input-field"
                            placeholder="Enter your registered email"
                          />
                          {otpInitForm.formState.errors.email && (
                            <p className="mt-2 text-sm text-danger-600">
                              {otpInitForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary w-full"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                          ) : (
                            'Send Verification Code'
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={otpVerifyForm.handleSubmit(handleOTPVerify)} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            {...otpVerifyForm.register('code')}
                            className="input-field text-center text-2xl tracking-wider"
                            placeholder="000000"
                            maxLength={6}
                          />
                          {otpVerifyForm.formState.errors.code && (
                            <p className="mt-2 text-sm text-danger-600">
                              {otpVerifyForm.formState.errors.code.message}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setCurrentEmail('');
                              otpInitForm.reset();
                              otpVerifyForm.reset();
                            }}
                            className="btn-secondary flex-1"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                            ) : (
                              'Verify & Login'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-2xl mb-4">
                      <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Welcome Back!</h2>
                    <p className="text-secondary-600 mb-6">You are successfully logged in to your account.</p>
                    <button
                      onClick={handleLogout}
                      className="btn-secondary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && isAuthenticated && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-secondary-900 mb-2">My Documents</h2>
                  <p className="text-secondary-600">Access your lab reports and invoices</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Reports Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Lab Reports ({documents.reports.length})
                    </h3>
                    <div className="space-y-3">
                      {documents.reports.length > 0 ? (
                        documents.reports.map((report) => (
                          <div key={report.id} className="p-4 border border-secondary-200 rounded-xl hover:shadow-soft transition-all duration-200">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-secondary-900 truncate">{report.name}</h4>
                                <p className="text-sm text-secondary-600">
                                  Created: {new Date(report.created_at).toLocaleDateString()}
                                </p>
                                {report.approved_by && (
                                  <p className="text-xs text-secondary-500">Approved by: {report.approved_by}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`badge ${getStatusBadge(report.status)}`}>
                                  {report.status}
                                </span>
                                <button className="btn-secondary btn-sm flex-shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-secondary-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No reports available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoices Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Invoices ({documents.invoices.length})
                    </h3>
                    <div className="space-y-3">
                      {documents.invoices.length > 0 ? (
                        documents.invoices.map((invoice) => (
                          <div key={invoice.id} className="p-4 border border-secondary-200 rounded-xl hover:shadow-soft transition-all duration-200">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-secondary-900 truncate">{invoice.name}</h4>
                                <p className="text-sm text-secondary-600">
                                  Created: {new Date(invoice.created_at).toLocaleDateString()}
                                </p>
                                {invoice.amount && (
                                  <p className="text-lg font-semibold text-primary-600">₹{invoice.amount}</p>
                                )}
                                {invoice.paid_at && (
                                  <p className="text-xs text-success-600">Paid: {new Date(invoice.paid_at).toLocaleDateString()}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`badge ${getStatusBadge(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                                <button className="btn-secondary btn-sm flex-shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-secondary-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>No invoices available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && isAuthenticated && (
              <div className="p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Notification Preferences</h2>
                    <p className="text-secondary-600">Manage how you want to receive updates about your samples</p>
                  </div>

                  <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          {...preferencesForm.register('owner_email')}
                          className="input-field"
                          placeholder="Enter your email"
                        />
                        {preferencesForm.formState.errors.owner_email && (
                          <p className="mt-2 text-sm text-danger-600">
                            {preferencesForm.formState.errors.owner_email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          {...preferencesForm.register('owner_phone')}
                          className="input-field"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-secondary-900">Notification Methods</h3>
                      
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 border border-secondary-200 rounded-xl hover:bg-secondary-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            {...preferencesForm.register('email_notifications')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-secondary-900">Email Notifications</div>
                            <div className="text-sm text-secondary-600">Receive updates via email about sample status changes</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border border-secondary-200 rounded-xl hover:bg-secondary-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            {...preferencesForm.register('whatsapp_notifications')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-secondary-900">WhatsApp Notifications</div>
                            <div className="text-sm text-secondary-600">Get instant updates on WhatsApp</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border border-secondary-200 rounded-xl hover:bg-secondary-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            {...preferencesForm.register('sms_notifications')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-secondary-900">SMS Notifications</div>
                            <div className="text-sm text-secondary-600">Receive text message alerts for important updates</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-secondary-200">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                        ) : (
                          'Save Preferences'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OwnerTrack;
