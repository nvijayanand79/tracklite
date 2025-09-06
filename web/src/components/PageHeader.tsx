import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../pages/Login';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  showBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  actions, 
  breadcrumbs,
  showBackButton = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs Row */}
        {breadcrumbs && (
          <div className="flex items-center gap-1 text-sm mb-1">
            {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.href ? (
                      <button
                        onClick={() => navigate(item.href!)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className="text-gray-900 font-medium">{item.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Page Actions */}
              {actions && (
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
  );
};

export default PageHeader;
