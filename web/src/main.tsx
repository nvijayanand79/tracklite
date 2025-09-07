import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import Login from './pages/Login'
import ReceiptsForm from './pages/ReceiptsForm'
import ReceiptsList from './pages/ReceiptsList'
import ReceiptDetail from './pages/ReceiptDetail'
import LabTestsList from './pages/LabTestsList'
import LabTestForm from './pages/LabTestForm'
import LabTestDetail from './pages/LabTestDetail'
import LabTestTransfer from './pages/LabTestTransfer'
import ReportsList from './pages/ReportsList'
import ReportForm from './pages/ReportForm'
import ReportDetail from './pages/ReportDetail'
import InvoicesList from './pages/InvoicesList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceDetail from './pages/InvoiceDetail'
import OwnerTrackNew from './pages/OwnerTrackNew'
import OwnerTrackSimple from './pages/OwnerTrackSimple'
import ProtectedRoute from './components/ProtectedRoute'

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading this page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
              >
                Go Home
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Technical Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { 
    path: '/owner/track', 
    element: (
      <ErrorBoundary>
        <OwnerTrackNew />
      </ErrorBoundary>
    ),
    errorElement: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-4">The owner tracking page could not be loaded.</p>
          <a href="/owner/track" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            Try Again
          </a>
        </div>
      </div>
    )
  },
  { 
    path: '/owner/track/*', 
    element: (
      <ErrorBoundary>
        <OwnerTrackNew />
      </ErrorBoundary>
    ) 
  },
  { 
    path: '/owner-track', 
    element: (
      <ErrorBoundary>
        <OwnerTrackNew />
      </ErrorBoundary>
    ),
    errorElement: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-4">The owner tracking page could not be loaded.</p>
          <a href="/owner-track" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            Try Again
          </a>
        </div>
      </div>
    )
  },
  { 
    path: '/owner-track/*', 
    element: (
      <ErrorBoundary>
        <OwnerTrackNew />
      </ErrorBoundary>
    ) 
  },
  { 
    path: '/receipts', 
    element: (
      <ProtectedRoute>
        <ReceiptsList />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/receipts/new', 
    element: (
      <ProtectedRoute>
        <ReceiptsForm />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/receipts/:id/edit', 
    element: (
      <ProtectedRoute>
        <ReceiptsForm />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/receipts/:id', 
    element: (
      <ProtectedRoute>
        <ReceiptDetail />
      </ProtectedRoute>
    ) 
  },
  // Lab Tests routes
  { 
    path: '/lab-tests', 
    element: (
      <ProtectedRoute>
        <LabTestsList />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/lab-tests/new', 
    element: (
      <ProtectedRoute>
        <LabTestForm />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/lab-tests/:labTestId', 
    element: (
      <ProtectedRoute>
        <LabTestDetail />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/lab-tests/:labTestId/transfer', 
    element: (
      <ProtectedRoute>
        <LabTestTransfer />
      </ProtectedRoute>
    ) 
  },
  // Reports routes
  { 
    path: '/reports', 
    element: (
      <ProtectedRoute>
        <ReportsList />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/reports/new', 
    element: (
      <ProtectedRoute>
        <ReportForm />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/reports/:id', 
    element: (
      <ProtectedRoute>
        <ReportDetail />
      </ProtectedRoute>
    ) 
  },
  // Invoices routes
  { 
    path: '/invoices', 
    element: (
      <ProtectedRoute>
        <InvoicesList />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/invoices/new', 
    element: (
      <ProtectedRoute>
        <InvoiceForm />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/invoices/:id', 
    element: (
      <ProtectedRoute>
        <InvoiceDetail />
      </ProtectedRoute>
    ) 
  },
  // Catch-all route for debugging
  { 
    path: '*', 
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-yellow-500 text-6xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">
            The page you're looking for doesn't exist.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            Current URL: <code className="bg-gray-100 px-2 py-1 rounded">{window.location.pathname}</code>
          </div>
          <div className="space-y-2">
            <a
              href="/owner/track"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Go to Owner Tracking
            </a>
            <a
              href="/"
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  },
])

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)