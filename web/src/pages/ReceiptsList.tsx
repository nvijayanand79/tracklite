import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

// Define types
interface Receipt {
  id: string;
  receiver_name: string;
  contact_number: string;
  receipt_date: string;
  branch: string;
  company: string;
  // API can sometimes return numbers as strings or missing values in demo data
  count_boxes?: number | string;
  receiving_mode: string;
  forward_to_central: number;
  courier_awb?: string;
  created_at: string;
  updated_at: string;
}

const ReceiptsList: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Remove auth token and redirect to login
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/receipts');
      // API sometimes returns an object wrapper like { value: [...], Count: n }
      // Normalize to always set an array into state to avoid runtime errors
      const payload = response?.data;
      if (Array.isArray(payload)) {
        setReceipts(payload);
      } else if (payload && Array.isArray(payload.value)) {
        setReceipts(payload.value);
      } else {
        // fallback: empty array
        setReceipts([]);
      }
      
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err.response?.data?.detail || 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const uniqueBranches = [...new Set(receipts.map(receipt => receipt.branch))];
  
  const filteredReceipts = branchFilter === 'all' 
    ? receipts 
    : receipts.filter(receipt => receipt.branch === branchFilter);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 flex flex-col z-50">
          {/* Navigation Content */}
          <div className="flex-1 p-2 space-y-2">
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
              onClick={() => navigate('/owner-track')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/owner-track') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Owner Portal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

          {/* Bottom Actions */}
          <div className="p-2 border-t border-gray-200 space-y-2">
            <button 
              onClick={handleLogout}
              className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 flex flex-col z-50">
        {/* Navigation Content */}
        <div className="flex-1 p-2 space-y-2">
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
            onClick={() => navigate('/owner-track')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/owner-track') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Owner Portal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-200 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Sample Receipts</h1>
                <p className="text-gray-600">Manage laboratory sample receipts</p>
              </div>
              <button
                onClick={() => navigate('/receipts/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Receipt
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Receipt Statistics - This replaces the dashboard stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-gray-900">{receipts.length}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Boxes</p>
                  <p className="text-xl font-semibold text-gray-900">{receipts.reduce((sum, receipt) => sum + Number(receipt.count_boxes ?? 0), 0)}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Forwarded</p>
                  <p className="text-xl font-semibold text-gray-900">{receipts.filter(r => r.forward_to_central === 1).length}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Courier</p>
                  <p className="text-xl font-semibold text-gray-900">{receipts.filter(r => r.receiving_mode === 'COURIER').length}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white p-4 rounded-lg shadow border mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                {filteredReceipts.length} of {receipts.length} receipts
              </span>
            </div>
          </div>

          {/* Receipts Table */}
          {filteredReceipts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border text-center">
              <p className="text-gray-500">No receipts found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boxes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forwarded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.receiver_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {receipt.contact_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(receipt.receipt_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {receipt.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(receipt.count_boxes ?? 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          receipt.receiving_mode === 'COURIER' ? 'bg-orange-100 text-orange-800' :
                          receipt.receiving_mode === 'COLLECTION' ? 'bg-blue-100 text-blue-800' :
                          receipt.receiving_mode === 'PERSON' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {receipt.receiving_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {receipt.forward_to_central === 1 ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/receipts/${receipt.id}`)}
                            className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="View Receipt"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/receipts/${receipt.id}/edit`)}
                            className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Edit Receipt"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const newStatus = receipt.forward_to_central === 1 ? 0 : 1;
                                await api.put(`/receipts/${receipt.id}`, {
                                  ...receipt,
                                  forward_to_central: newStatus
                                });
                                fetchReceipts(); // Refresh the list
                              } catch (err) {
                                console.error('Error updating receipt:', err);
                                setError('Failed to update receipt status');
                              }
                            }}
                            className="inline-flex items-center px-2 py-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                            title={receipt.forward_to_central === 1 ? 'Unforward to Central' : 'Forward to Central'}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {receipt.forward_to_central === 1 ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                            {receipt.forward_to_central === 1 ? 'Unforward' : 'Forward'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptsList;
