import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface LabTest {
  id: string;
  receipt_id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: 'IN_PROGRESS' | 'COMPLETED';
  lab_report_status: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

interface LabTestStats {
  total: number;
  pending: number;
  completed: number;
}

const LabTestsList: React.FC = () => {
  const navigate = useNavigate();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<LabTestStats>({
    total: 0,
    pending: 0,
    completed: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/labtests/');
      // API returns {value: [...], Count: number} structure
      const labTestsData = response.data.value || response.data;
      
      setLabTests(labTestsData);
      
      // Calculate stats
      const total = labTestsData.length;
      const pending = labTestsData.filter((test: LabTest) => test.test_status === 'IN_PROGRESS').length;
      const completed = labTestsData.filter((test: LabTest) => test.test_status === 'COMPLETED').length;
      
      setStats({ total, pending, completed });
    } catch (error) {
      setError('Failed to fetch lab tests');
      console.error('Error fetching lab tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLabTests = labTests.filter(test => {
    const matchesSearch = (test.lab_doc_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (test.lab_person?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (test.remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || test.test_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Quick Navigation Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-gray-600"
            title="Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/receipts')}
            className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-gray-600"
            title="Receipts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/lab-tests')}
            className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors"
            title="Lab Tests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-gray-600"
            title="Reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-gray-600"
            title="Reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/invoices')}
            className="w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-gray-600"
            title="Invoices"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        <div className="mt-auto p-2 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
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
            <h1 className="text-2xl font-semibold text-gray-900">Lab Tests</h1>
            <p className="text-gray-600">Manage laboratory test samples and results</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by test name, sample type, or owner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Lab Tests Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Laboratory Tests</h3>
                </div>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Loading lab tests...</div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-red-500">{error}</div>
                    </div>
                  ) : filteredLabTests.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">No lab tests found</div>
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Doc No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Person</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLabTests.map((test) => (
                          <tr key={test.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{test.lab_doc_no}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{test.lab_person}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                test.test_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                test.test_status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {test.test_status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{test.lab_report_status}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => navigate(`/lab-tests/${test.id}`)}
                                  className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                  title="View Test Details"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Lab Test Statistics */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Lab Test Statistics</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-900">Total</span>
                    </div>
                    <span className="text-md font-bold text-blue-600">{stats.total}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-900">Pending</span>
                    </div>
                    <span className="text-md font-bold text-yellow-600">{stats.pending}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-900">Completed</span>
                    </div>
                    <span className="text-md font-bold text-green-600">{stats.completed}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    🧪 Add New Test
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    📊 View Test Results
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    📋 Generate Test Report
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    ⚙️ Test Settings
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Activity</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Test Completed</p>
                    <p className="text-xs text-green-600">Blood Panel - Sample #001</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Test Pending</p>
                    <p className="text-xs text-yellow-600">Urine Analysis - Sample #002</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">New Test Added</p>
                    <p className="text-xs text-blue-600">DNA Test - Sample #003</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTestsList;
