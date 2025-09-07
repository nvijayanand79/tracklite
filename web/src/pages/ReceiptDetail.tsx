import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar'
import { api } from '../services/api';

interface Receipt {
  id: string;
  receiver_name: string;
  contact_number: string;
  receipt_date: string;
  branch: string;
  company: string;
  // new schema fields
  count_boxes: number;
  receiving_mode: string;
  forward_to_central: number;
  courier_awb?: string | null;
  tracking_number?: string | null;
  created_at: string;
  updated_at: string;
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = async () => {
    if (!id) {
      setError('No receipt ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/receipts/${id}`);
      // server returns receipt with lab_tests array mixed in
      const data = response.data;
      // normalize field names to this component's Receipt interface
      const normalized = {
        ...data,
        receipt_date: data.receipt_date || data.date,
        count_boxes: Number(data.count_boxes ?? data.count_of_boxes ?? 0),
        forward_to_central: data.forward_to_central ?? data.forward_to_chennai ? 1 : 0,
        courier_awb: data.courier_awb ?? data.awb_no ?? null,
      };
      setReceipt(normalized as any);
      
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      if (err.response?.status === 404) {
        setError('Receipt not found');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch receipt details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button 
              onClick={() => navigate('/')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/receipts')}
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Receipts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/lab-tests')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/invoices')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Invoices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading receipt details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button 
              onClick={() => navigate('/')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/receipts')}
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Receipts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/lab-tests')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/invoices')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Invoices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <NavigationBar />
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => navigate('/receipts')}
                        className="bg-red-100 px-3 py-2 rounded text-red-800 hover:bg-red-200"
                      >
                        ← Back to Receipts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button 
              onClick={() => navigate('/')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/receipts')}
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Receipts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/lab-tests')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/invoices')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Invoices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center">
              <p className="text-gray-600">Receipt not found</p>
              <button
                onClick={() => navigate('/receipts')}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                ← Back to Receipts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/receipts')}
            className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
            title="Receipts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/lab-tests')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Lab Tests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/invoices')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Invoices"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
                    <p className="text-sm text-gray-600">Tracking Number: {receipt.tracking_number || receipt.courier_awb || '—'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/receipts')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to List
              </button>
              <button
                onClick={() => navigate(`/receipts/${receipt.id}/edit`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Edit Receipt
              </button>
            </div>
          </div>

          {/* Receipt Information Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Basic Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Receiver Name</dt>
                    <dd className="text-sm text-gray-900">{receipt.receiver_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Contact Number</dt>
                    <dd className="text-sm text-gray-900">{receipt.contact_number}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Date</dt>
                    <dd className="text-sm text-gray-900">{receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString() : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Branch</dt>
                    <dd className="text-sm text-gray-900">{receipt.branch}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Company</dt>
                    <dd className="text-sm text-gray-900">{receipt.company}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Shipping Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Number of Boxes</dt>
                    <dd className="text-sm text-gray-900">{Number(receipt.count_boxes ?? 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Receiving Mode</dt>
                      <dd className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.receiving_mode === 'COURIER' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {receipt.receiving_mode}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Forward to Chennai</dt>
                      <dd className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.forward_to_central === 1
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {receipt.forward_to_central === 1 ? 'Yes' : 'No'}
                      </span>
                    </dd>
                  </div>
                  {receipt.courier_awb && (
                    <div>
                      <dt className="text-sm font-medium text-gray-700">AWB Number</dt>
                      <dd className="text-sm text-gray-900">{receipt.courier_awb}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Tracking Number</dt>
                    <dd className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {receipt.tracking_number}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-700">Created At</dt>
                <dd className="text-sm text-gray-900">{new Date(receipt.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">Last Updated</dt>
                <dd className="text-sm text-gray-900">{new Date(receipt.updated_at).toLocaleString()}</dd>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetail;
