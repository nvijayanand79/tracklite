import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import api from '../services/api';

interface LabTest {
  id: number;
  test_name?: string;
  sample_type?: string;
  test_status?: string;
  owner_name?: string;
  created_at?: string;
  location?: string;
}

interface LabTestStats {
  total: number;
  pending: number;
  completed: number;
  priority: number;
}

const LabTestsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState<LabTestStats>({
    total: 0,
    pending: 0,
    completed: 0,
    priority: 0
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
      const labTestsData = response.data;
      
      setLabTests(labTestsData);
      
      // Calculate stats
      const total = labTestsData.length;
      const pending = labTestsData.filter((test: LabTest) => test.test_status === 'pending').length;
      const completed = labTestsData.filter((test: LabTest) => test.test_status === 'completed').length;
      const priority = labTestsData.filter((test: LabTest) => test.test_status === 'priority').length;
      
      setStats({ total, pending, completed, priority });
    } catch (error) {
      setError('Failed to fetch lab tests');
      console.error('Error fetching lab tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLabTests = labTests.filter(test => {
    const matchesSearch = (test.test_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (test.sample_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (test.owner_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || test.test_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  const isActivePage = (page: string) => location.pathname.includes(page);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-16 bg-blue-900 flex flex-col items-center py-4 space-y-6">
        <div className="text-white text-xl font-bold">
          TL
        </div>
        
        <nav className="flex flex-col space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/dashboard') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Dashboard"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/receipts')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/receipts') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Receipts"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/labtests')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/labtests') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Lab Tests"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/reports')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/reports') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Reports"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/invoices')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/invoices') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Invoices"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/owner-track')}
            className={`p-3 rounded-lg transition-colors group ${
              isActivePage('/owner-track') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            title="Owner Track"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </nav>
        
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="p-3 rounded-lg hover:bg-red-600 transition-colors group"
            title="Logout"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Stats Section */}
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Lab Tests Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700">Total Tests</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-700">Pending</h3>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-700">Completed</h3>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-700">Priority</h3>
              <p className="text-2xl font-bold text-red-900">{stats.priority}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by test name, sample type, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lab Tests Table */}
        <div className="flex-1 bg-white p-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading lab tests...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sample Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLabTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{test.test_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{test.sample_type || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          test.test_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : test.test_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : test.test_status === 'priority'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.test_status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{test.owner_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{test.location || 'N/A'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLabTests.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No lab tests found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabTestsList;