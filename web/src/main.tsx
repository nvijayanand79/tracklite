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
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
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
])

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)