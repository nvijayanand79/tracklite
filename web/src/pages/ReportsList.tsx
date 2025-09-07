import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { reportsAPI } from '../services/api';

// Define types for Report (matching the enhanced API response)
interface Report {
  id: string;
  labtest_id: string;
  retesting_requested: number;
  final_status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  comm_status: 'PENDING' | 'DELIVERED';
  comm_channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  communicated_to_accounts: number;
  created_at: string;
  updated_at: string;
  // Joined lab test data
  receipt_id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: 'IN_PROGRESS' | 'COMPLETED';
  lab_report_status: 'DRAFT' | 'READY' | 'SIGNED_OFF';
  lab_remarks: string;
  // Joined receipt data
  receiver_name: string;
  contact_number: string;
  branch: string;
  company: string;
  count_boxes: number;
  receiving_mode: string;
  receipt_date: string;
}

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reportsAPI.list();
      // API returns {value: [...], Count: number} structure
      setReports(response.data.value || response.data);
      
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.detail || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter(report => {
        // Map the filter values to actual field values
        if (statusFilter === 'DRAFT') return report.final_status === 'DRAFT';
        if (statusFilter === 'COMPLETED') return report.test_status === 'COMPLETED';
        if (statusFilter === 'IN_PROGRESS') return report.test_status === 'IN_PROGRESS';
        return false;
      });

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
            <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invoices">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button onClick={() => navigate('/reports')} className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors" title="Reports">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invoices">
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
          <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invoices">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button onClick={() => navigate('/reports')} className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors" title="Reports">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button onClick={() => navigate('/invoices')} className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invoices">
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
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="text-gray-600">Manage test results and analysis reports</p>
              </div>
              <button onClick={() => navigate('/reports/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Generate Report
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Report Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-gray-900">{reports.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-xl font-semibold text-gray-900">{reports.filter(r => r.test_status === 'COMPLETED').length}</p>
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
                  <p className="text-xs text-gray-600">In Progress</p>
                  <p className="text-xl font-semibold text-gray-900">{reports.filter(r => r.test_status === 'IN_PROGRESS').length}</p>
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
                  <p className="text-xs text-gray-600">Draft</p>
                  <p className="text-xl font-semibold text-gray-900">{reports.filter(r => r.final_status === 'DRAFT').length}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <span className="text-sm text-gray-500">{filteredReports.length} of {reports.length} reports</span>
            </div>
          </div>

          {/* Reports Table */}
          {filteredReports.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border text-center">
              <p className="text-gray-500">No reports found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Test ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boxes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900">{report.id.substring(0, 8)}...</td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">{report.labtest_id ? report.labtest_id.substring(0, 8) + '...' : 'N/A'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">{report.company}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">{report.count_boxes}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.test_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          report.test_status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.test_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.final_status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          report.final_status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.final_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-medium">
                        <button 
                          onClick={() => navigate(`/reports/${report.id}`)} 
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          title="View Report"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
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

export default ReportsList;
