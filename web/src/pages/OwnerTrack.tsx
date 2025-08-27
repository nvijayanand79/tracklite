import React, { useState, useEffect } from 'react';
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

  // Forms
  const trackingForm = useForm<TrackingForm>({
    resolver: zodResolver(trackingSchema),
  });

  const preferencesForm = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      email_notifications: true,
      whatsapp_notifications: false,
      sms_notifications: false,
    },
  });

  const otpInitForm = useForm<OTPInitForm>({
    resolver: zodResolver(otpInitSchema),
  });

  const otpVerifyForm = useForm<OTPVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
  });

  // Check authentication status on load
  useEffect(() => {
    const token = localStorage.getItem('ownerToken');
    if (token) {
      setIsAuthenticated(true);
      loadDocuments();
    }
  }, []);

  // Clear all tokens and force fresh login
  const clearAllTokens = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setActiveTab('track');
    setDocuments({ reports: [], invoices: [] });
    console.log('All tokens cleared');
  };

  // Handle tracking form submission
  const onTrackSubmit = async (data: TrackingForm) => {
    setLoading(true);
    try {
      const result = await api.get(`/owner/track?query=${encodeURIComponent(data.query)}`);
      setTrackingResult(result.data);
    } catch (error) {
      console.error('Tracking failed:', error);
      setTrackingResult({ found: false, timeline: [], documents: [] });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP initialization
  const onOTPInit = async (data: OTPInitForm) => {
    setLoading(true);
    try {
      await api.post('/auth/owner/email-otp-init', data);
      setOtpSent(true);
      setCurrentEmail(data.email);
      otpVerifyForm.setValue('email', data.email);
    } catch (error) {
      console.error('OTP initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const onOTPVerify = async (data: OTPVerifyForm) => {
    setLoading(true);
    try {
      const result = await api.post('/auth/owner/email-otp-verify', data);
      localStorage.setItem('ownerToken', result.data.access_token);
      setIsAuthenticated(true);
      setActiveTab('documents');
      loadDocuments();
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load owner documents
  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('ownerToken');
      console.log('Loading documents with token:', token ? 'Token exists' : 'No token');
      
      const result = await api.get('/owner/documents');
      console.log('Documents API response:', result.data);
      setDocuments(result.data);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  // Handle document download
  const downloadDocument = async (type: 'report' | 'invoice', id: string) => {
    try {
      const response = await api.get(`/owner/${type}s/${id}/download`, {
        responseType: 'blob' // Important: Tell axios to expect binary data
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type}_${id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Downloaded: ${filename}`);
    } catch (error: any) {
      console.error('Download failed:', error);
      console.error('Download error details:', error.response?.data);
      alert('Download failed. Please try again.');
    }
  };

  // Handle preferences form submission
  const onPreferencesSubmit = async (data: PreferencesForm) => {
    setLoading(true);
    try {
      await api.post('/owner/notify-preferences', data);
      alert('Notification preferences updated successfully!');
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    setIsAuthenticated(false);
    setActiveTab('track');
    setDocuments({ reports: [], invoices: [] });
  };

  // Timeline component
  const TimelineComponent: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
    <div className="flex flex-col space-y-4">
      {steps.map((step, index) => (
        <div key={step.step} className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            step.status === 'completed' ? 'bg-green-500' :
            step.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
          }`}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${
              step.status === 'completed' ? 'text-green-700' :
              step.status === 'current' ? 'text-blue-700' : 'text-gray-500'
            }`}>
              {step.description || step.step.replace('_', ' ').toUpperCase()}
            </div>
            {step.timestamp && (
              <div className="text-sm text-gray-500">
                {new Date(step.timestamp).toLocaleString()}
              </div>
            )}
          </div>
          {step.status === 'completed' && (
            <div className="text-green-500">✓</div>
          )}
          {step.status === 'current' && (
            <div className="text-blue-500 animate-pulse">●</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Owner Portal</h1>

      {/* Debug Section */}
      <div className="mb-6 flex justify-between items-center bg-gray-100 p-4 rounded">
        <div className="text-sm text-gray-600">
          {isAuthenticated ? (
            <span className="text-green-600">✓ Logged in as owner</span>
          ) : (
            <span>Public access (login for full features)</span>
          )}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => {
              console.log('localStorage tokens:', {
                ownerToken: localStorage.getItem('ownerToken') ? 'EXISTS' : 'NONE',
                authToken: localStorage.getItem('auth_token') ? 'EXISTS' : 'NONE'
              });
              console.log('Current URL:', window.location.pathname);
            }}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
          >
            Debug Tokens
          </button>
          <button
            onClick={clearAllTokens}
            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
          >
            Clear All Tokens
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('track')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'track'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Track Shipment
          </button>
          
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Documents
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notifications
              </button>
              <button
                onClick={handleLogout}
                className="py-2 px-1 border-b-2 border-transparent text-red-500 hover:text-red-700 font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'login'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Login
            </button>
          )}
        </nav>
      </div>

      {/* Track Tab */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Track Your Shipment</h2>
            <form onSubmit={trackingForm.handleSubmit(onTrackSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter AWB, Receipt ID, Report ID, or Invoice Number
                </label>
                <input
                  {...trackingForm.register('query')}
                  type="text"
                  placeholder="e.g., INV-2025-0001, AWB123456789, or UUID"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {trackingForm.formState.errors.query && (
                  <p className="text-red-500 text-sm mt-1">
                    {trackingForm.formState.errors.query.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Tracking...' : 'Track'}
              </button>
            </form>
          </div>

          {/* Tracking Results */}
          {trackingResult && (
            <div className="bg-white p-6 rounded-lg shadow">
              {trackingResult.found ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-green-600">Shipment Found!</h3>
                  
                  {/* Timeline */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Progress Timeline</h4>
                    <TimelineComponent steps={trackingResult.timeline} />
                  </div>

                  {/* Available Documents */}
                  {trackingResult.documents.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium mb-4">Available Documents</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trackingResult.documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium">{doc.name}</h5>
                            <p className="text-sm text-gray-600 capitalize">Status: {doc.status}</p>
                            {doc.download_available && isAuthenticated && (
                              <button
                                onClick={() => downloadDocument(doc.type as 'report' | 'invoice', doc.id)}
                                className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Download
                              </button>
                            )}
                            {doc.download_available && !isAuthenticated && (
                              <p className="mt-2 text-sm text-orange-600">Login required for download</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-600">No Results Found</h3>
                  <p className="text-gray-600">Please check your tracking number and try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && !isAuthenticated && (
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Owner Login</h2>
            
            {!otpSent ? (
              <form onSubmit={otpInitForm.handleSubmit(onOTPInit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...otpInitForm.register('email')}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {otpInitForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {otpInitForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={otpVerifyForm.handleSubmit(onOTPVerify)} className="space-y-4">
                <div className="text-sm text-green-600 mb-4">
                  OTP sent to {currentEmail}. Check the server console for the code.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP Code
                  </label>
                  <input
                    {...otpVerifyForm.register('code')}
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {otpVerifyForm.formState.errors.code && (
                    <p className="text-red-500 text-sm mt-1">
                      {otpVerifyForm.formState.errors.code.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    otpInitForm.reset();
                    otpVerifyForm.reset();
                  }}
                  className="w-full text-blue-600 hover:text-blue-700"
                >
                  Back to Email Entry
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && isAuthenticated && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">My Documents</h2>
          
          {/* Reports */}
          <div>
            <h3 className="text-lg font-medium mb-4">Approved Reports</h3>
            {documents.reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.reports.map((report) => (
                  <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-gray-600">Status: {report.status}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    {report.approved_by && (
                      <p className="text-sm text-gray-600">Approved by: {report.approved_by}</p>
                    )}
                    <button
                      onClick={() => downloadDocument('report', report.id)}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Download Report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No approved reports available.</p>
            )}
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-medium mb-4">Invoices</h3>
            {documents.invoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                    <h4 className="font-medium">{invoice.name}</h4>
                    <p className="text-sm text-gray-600">Status: {invoice.status}</p>
                    <p className="text-sm text-gray-600">
                      Amount: ${invoice.amount?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                    {invoice.paid_at && (
                      <p className="text-sm text-gray-600">
                        Paid: {new Date(invoice.paid_at).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => downloadDocument('invoice', invoice.id)}
                      className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Download Invoice
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No invoices available.</p>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && isAuthenticated && (
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...preferencesForm.register('owner_email')}
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {preferencesForm.formState.errors.owner_email && (
                  <p className="text-red-500 text-sm mt-1">
                    {preferencesForm.formState.errors.owner_email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  {...preferencesForm.register('owner_phone')}
                  type="tel"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    {...preferencesForm.register('email_notifications')}
                    type="checkbox"
                    id="email_notifications"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                    Email Notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...preferencesForm.register('whatsapp_notifications')}
                    type="checkbox"
                    id="whatsapp_notifications"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="whatsapp_notifications" className="ml-2 block text-sm text-gray-900">
                    WhatsApp Notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...preferencesForm.register('sms_notifications')}
                    type="checkbox"
                    id="sms_notifications"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sms_notifications" className="ml-2 block text-sm text-gray-900">
                    SMS Notifications
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Preferences'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerTrack;
