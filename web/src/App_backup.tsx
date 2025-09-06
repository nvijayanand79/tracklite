import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout, GridLayout, Section, StatCard } from './components/layout';
import { Button } from './components/ui';
import { authUtils } from './pages/Login';

export default function App() {
  const navigate = useNavigate();
  const isAuthenticated = authUtils.isAuthenticated();

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  const dashboardActions = [
    {
      href: '/owner/track',
      label: 'Owner Track',
      icon: '🔍',
      description: 'Track orders and shipments',
      color: 'bg-gradient-to-r from-sky-500 to-sky-600' as const
    },
    {
      to: '/receipts/new',
      label: 'New Receipt',
      icon: '📄',
      description: 'Create a new receipt',
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600' as const
    },
    {
      to: '/receipts',
      label: 'Receipts',
      icon: '📋',
      description: 'Manage all receipts',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600' as const
    },
    {
      to: '/lab-tests',
      label: 'Lab Tests',
      icon: '🧪',
      description: 'Laboratory test management',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600' as const
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: '📊',
      description: 'View and generate reports',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600' as const
    },
    {
      to: '/invoices',
      label: 'Invoices',
      icon: '💰',
      description: 'Invoice management',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600' as const
    }
  ];

  const stats = [
    { title: 'Total Receipts', value: '124', icon: '📋', color: 'blue' as const },
    { title: 'Active Tests', value: '18', icon: '🧪', color: 'purple' as const },
    { title: 'Reports Generated', value: '45', icon: '📊', color: 'green' as const },
    { title: 'Pending Invoices', value: '7', icon: '💰', color: 'yellow' as const }
  ];

  if (!isAuthenticated) {
    return (
      <PageLayout 
        title="TraceLite Enterprise"
        subtitle="Comprehensive laboratory management and tracking system"
        className="min-h-screen"
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Section className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-3xl font-bold">TL</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to TraceLite
              </h2>
              <p className="text-gray-600 mb-8">
                Your comprehensive solution for laboratory management, order tracking, and business operations.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/owner/track">
                <Button size="lg" className="w-full sm:w-auto">
                  🔍 Owner Track
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  🔐 Internal Login
                </Button>
              </Link>
            </div>
          </Section>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your TraceLite system."
      actions={
        <Button variant="outline" onClick={handleLogout}>
          🚪 Logout
        </Button>
      }
    >
      {/* Stats Overview */}
      <Section title="System Overview" className="mb-8">
        <GridLayout cols={4} gap="md">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              color={stat.color}
              icon={<span className="text-xl">{stat.icon}</span>}
            />
          ))}
        </GridLayout>
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions" subtitle="Select an action to get started">
        <GridLayout cols={3} gap="lg">
          {dashboardActions.map((action, index) => (
            <div key={index} className="group">
              {action.to ? (
                <Link to={action.to} className="block">
                  <ActionCard action={action} />
                </Link>
              ) : (
                <a href={action.href} className="block">
                  <ActionCard action={action} />
                </a>
              )}
            </div>
          ))}
        </GridLayout>
      </Section>
    </PageLayout>
  );
}

const ActionCard: React.FC<{ action: any }> = ({ action }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group-hover:scale-105 border border-gray-100">
    <div className="flex items-center mb-4">
      <div className={`p-3 rounded-xl ${action.color} shadow-lg`}>
        <span className="text-white text-2xl">{action.icon}</span>
      </div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{action.label}</h3>
    <p className="text-gray-600 text-sm">{action.description}</p>
    <div className="mt-4 flex items-center text-blue-600 font-medium">
      <span className="text-sm">Get started</span>
      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
);