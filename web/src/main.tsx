import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import OwnerTrack from './pages/OwnerTrack'
import Login from './pages/Login'
import ReceiptsForm from './pages/ReceiptsForm'
import ReceiptsList from './pages/ReceiptsList'
import LabTestsList from './pages/LabTestsList'
import LabTestForm from './pages/LabTestForm'
import LabTestDetail from './pages/LabTestDetail'
import LabTestTransfer from './pages/LabTestTransfer'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/owner/track', element: <OwnerTrack /> },
  { path: '/login', element: <Login /> },
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
  { 
    path: '/reports', 
    element: (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reports</h1>
            <p className="text-gray-600">This page is protected and requires authentication.</p>
          </div>
        </div>
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/invoices', 
    element: (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invoices</h1>
            <p className="text-gray-600">This page is protected and requires authentication.</p>
          </div>
        </div>
      </ProtectedRoute>
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