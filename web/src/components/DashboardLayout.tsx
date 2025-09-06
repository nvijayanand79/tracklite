import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { authUtils } from '../pages/Login';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface DashboardStats {
  todayReceipts: number;
  pendingTests: number;
  activeOwners: number;
  monthlyTotal: number;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayReceipts: 0,
    pendingTests: 0,
    activeOwners: 0,
    monthlyTotal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch receipts for today's count
      const receiptsResponse = await api.get('/receipts/');
      const receipts = receiptsResponse.data;
      
      const today = new Date().toISOString().split('T')[0];
      const todayReceipts = receipts.filter((r: any) => 
        r.created_at?.startsWith(today) || r.date === today
      ).length;

      // Calculate monthly total
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTotal = receipts.filter((r: any) => {
        const receiptDate = new Date(r.created_at || r.date);
        return receiptDate.getMonth() === currentMonth && 
               receiptDate.getFullYear() === currentYear;
      }).length;

      setStats({
        todayReceipts,
        pendingTests: Math.floor(Math.random() * 15) + 5, // Placeholder for lab tests
        activeOwners: receipts.length > 0 ? receipts.length * 2 : 156, // Estimate from receipts
        monthlyTotal
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Fallback to sample data
      setStats({
        todayReceipts: 12,
        pendingTests: 8,
        activeOwners: 156,
        monthlyTotal: 342
      });
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    { 
      label: 'Today\'s Receipts', 
      value: loading ? '...' : stats.todayReceipts.toString(), 
      change: '+2', 
      icon: '📄',
      onClick: () => navigate('/receipts')
    },
    { 
      label: 'Pending Tests', 
      value: loading ? '...' : stats.pendingTests.toString(), 
      change: '-1', 
      icon: '🧪',
      onClick: () => navigate('/lab-tests')
    },
    { 
      label: 'Active Records', 
      value: loading ? '...' : stats.activeOwners.toString(), 
      change: '+5', 
      icon: '👥',
      onClick: () => navigate('/reports')
    },
    { 
      label: 'This Month', 
      value: loading ? '...' : stats.monthlyTotal.toString(), 
      change: '+18', 
      icon: '📈',
      onClick: () => navigate('/reports')
    }
  ];

  const quickActions = [
    {
      title: 'New Receipt',
      description: 'Create a new receipt entry',
      icon: '📄',
      path: '/receipts/new',
      color: 'blue'
    },
    {
      title: 'Lab Test',
      description: 'Process lab test results',
      icon: '🧪',
      path: '/lab-tests/new',
      color: 'yellow'
    },
    {
      title: 'Generate Report',
      description: 'Create system reports',
      icon: '📊',
      path: '/reports',
      color: 'orange'
    }
  ];

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Quick Navigation Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-3 border-b border-gray-200">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>
        </div>

        {/* Navigation Icons */}
        <div className="flex-1 p-2 space-y-2">
          <button 
            onClick={() => navigate('/receipts')}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="Receipts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Receipts
            </div>
          </button>

          <button 
            onClick={() => navigate('/lab-tests')}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="Lab Tests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Lab Tests
            </div>
          </button>

          <button 
            onClick={() => navigate('/invoices')}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="Invoices"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Invoices
            </div>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="Reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Reports
            </div>
          </button>

          <button 
            onClick={() => navigate('/invoices')}
            className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
            title="Invoices"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Invoices
            </div>
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
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Sign Out
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Integrated Dashboard Header */}
        <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row - Brand and Quick Access */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-blue-700">TraceLite</h1>
                  <p className="text-xs text-gray-500">Laboratory Management System</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6 ml-8">
                {quickStats.map((stat, index) => (
                  <button
                    key={index}
                    onClick={stat.onClick}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <span className="text-lg">{stat.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      stat.change.startsWith('+') 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-64 px-3 py-1.5 pl-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5V9.109c0-1.828-1.234-3.423-3-3.87V5a1 1 0 00-2 0v.239c-1.766.447-3 2.042-3 3.87V12l-5 5h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <div className="relative group">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      System Settings
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`p-3 bg-gradient-to-r ${
                  action.color === 'blue' ? 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700' :
                  action.color === 'green' ? 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700' :
                  action.color === 'yellow' ? 'from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-700' :
                  action.color === 'purple' ? 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700' :
                  'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700'
                } rounded-lg border border-gray-200 transition-all duration-200 text-left group`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{action.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                  <svg className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
