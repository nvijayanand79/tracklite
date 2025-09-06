import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface OwnerRecord {
  id: number;
  owner_name: string;
  email: string;
  location: string;
  phone?: string;
  tracking_status: string;
  created_at: string;
  last_activity?: string;
}

interface OwnerStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
}

const OwnerTrack: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [stats, setStats] = useState<OwnerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/owners/');
      const ownersData = response.data;
      
      setOwners(ownersData);
      
      // Calculate stats
      const total = ownersData.length;
      const active = ownersData.filter((owner: OwnerRecord) => owner.tracking_status === 'active').length;
      const inactive = ownersData.filter((owner: OwnerRecord) => owner.tracking_status === 'inactive').length;
      const verified = ownersData.filter((owner: OwnerRecord) => owner.tracking_status === 'verified').length;
      
      setStats({ total, active, inactive, verified });
    } catch (error) {
      setError('Failed to fetch owner records');
      console.error('Error fetching owners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOwners = owners.filter(owner => {
    const matchesSearch = owner.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || owner.tracking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogout = () => {
    // Remove auth token and redirect to login
    localStorage.removeItem('token');
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Owner Portal & Tracking</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700">Total Owners</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-700">Active</h3>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Inactive</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-700">Verified</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.verified}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or location..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owners Table */}
        <div className="flex-1 bg-white p-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading owner records...</p>
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
                      Owner Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{owner.owner_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          owner.tracking_status === 'verified'
                            ? 'bg-purple-100 text-purple-800'
                            : owner.tracking_status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : owner.tracking_status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {owner.tracking_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(owner.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.last_activity ? new Date(owner.last_activity).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredOwners.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No owner records found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerTrack;
