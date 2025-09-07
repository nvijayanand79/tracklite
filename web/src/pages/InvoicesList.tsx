import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

// Define types for Invoice
interface Invoice {
  id: string;
  report_id: string;
  invoice_no: string;
  status: 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'CANCELLED';
  amount: number;
  issued_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Remove auth token and redirect to login
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/invoices');
      // API returns {value: [...], Count: number} structure
      setInvoices(response.data.value || response.data);
      
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.detail || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = statusFilter === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === statusFilter);

  if (loading) {
    return (
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button onClick={() => navigate('/')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Dashboard">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
            <button onClick={() => navigate('/receipts')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Receipts">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={() => navigate('/lab-tests')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lab Tests">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>
            <button onClick={() => navigate('/reports')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Reports">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors" title="Invoices">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
          <div className="mt-auto p-2 border-t border-gray-200">
            <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1">
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
    <div className="flex">
      {/* Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2 space-y-2">
          <button onClick={() => navigate('/')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Dashboard">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>
          <button onClick={() => navigate('/receipts')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Receipts">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button onClick={() => navigate('/lab-tests')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lab Tests">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>
          <button onClick={() => navigate('/reports')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Reports">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button onClick={() => navigate('/reports')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Reports">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors" title="Invoices">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
        <div className="mt-auto p-2 border-t border-gray-200">
          <button onClick={handleLogout} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
                <p className="text-gray-600">Manage billing and payment tracking</p>
              </div>
              <button onClick={() => navigate('/invoices/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Invoice Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-gray-900">{invoices.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="text-xl font-semibold text-gray-900">{invoices.filter(i => i.status === 'PAID').length}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-xl font-semibold text-gray-900">{invoices.filter(i => ['DRAFT', 'ISSUED', 'SENT'].includes(i.status)).length}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-xl font-semibold text-gray-900">${invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0).toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white p-4 rounded-lg shadow border mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <span className="text-sm text-gray-500">{filteredInvoices.length} of {invoices.length} invoices</span>
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border text-center">
              <p className="text-gray-500">No invoices found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.report_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(Number(invoice.amount) || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-800' :
                          invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'Not issued'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => navigate(`/invoices/${invoice.id}`)} 
                            className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="View Invoice"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button 
                            onClick={() => navigate(`/invoices/${invoice.id}/edit`)} 
                            className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Edit Invoice"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                            <button 
                              onClick={async () => {
                                try {
                                  await api.put(`/invoices/${invoice.id}`, {
                                    ...invoice,
                                    status: 'PAID'
                                  });
                                  fetchInvoices(); // Refresh the list
                                } catch (err) {
                                  console.error('Error updating invoice:', err);
                                  setError('Failed to mark invoice as paid');
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                              title="Mark as Paid"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Mark Paid
                            </button>
                          )}
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

export default InvoicesList;
