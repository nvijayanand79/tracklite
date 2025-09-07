import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { reportsAPI } from '../services/api'

const updateSchema = z.object({
  comm_status: z.enum(['PENDING', 'DISPATCHED', 'DELIVERED']),
  comm_channel: z.enum(['COURIER', 'IN_PERSON', 'EMAIL']),
  communicated_to_accounts: z.boolean(),
})

const testStatusUpdateSchema = z.object({
  test_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  lab_report_status: z.enum(['PENDING', 'DRAFT', 'COMPLETED']),
  lab_remarks: z.string().optional(),
})

type UpdateFormData = z.infer<typeof updateSchema>
type TestStatusUpdateData = z.infer<typeof testStatusUpdateSchema>

interface Report {
  id: string
  labtest_id: string
  retesting_requested: boolean
  final_status: 'DRAFT' | 'READY_FOR_APPROVAL' | 'APPROVED' | 'REJECTED'
  approved_by: string | null
  comm_status: 'PENDING' | 'DISPATCHED' | 'DELIVERED'
  comm_channel: 'COURIER' | 'IN_PERSON' | 'EMAIL'
  communicated_to_accounts: boolean
  created_at: string
  updated_at: string
  // Lab test related fields
  receipt_id: string
  lab_doc_no: string | null
  lab_person: string | null
  test_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  lab_report_status: 'PENDING' | 'DRAFT' | 'COMPLETED'
  lab_remarks: string | null
  // Receipt related fields
  receiver_name: string | null
  contact_number: string | null
  branch: string | null
  company: string | null
  count_boxes: number | null
  receiving_mode: string | null
  receipt_date: string | null
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [testStatusUpdateLoading, setTestStatusUpdateLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema)
  })

  const {
    register: registerTestStatus,
    handleSubmit: handleTestStatusSubmit,
    reset: resetTestStatus,
    formState: { errors: testStatusErrors, isSubmitting: isTestStatusSubmitting }
  } = useForm<TestStatusUpdateData>({
    resolver: zodResolver(testStatusUpdateSchema)
  })

  const fetchReport = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const response = await reportsAPI.get(id)
      const reportData = response.data
      setReport(reportData)
      
      // Reset form with current values
      reset({
        comm_status: reportData.comm_status,
        comm_channel: reportData.comm_channel,
        communicated_to_accounts: reportData.communicated_to_accounts,
      })
      
      // Reset test status form with current values
      resetTestStatus({
        test_status: reportData.test_status || 'PENDING',
        lab_report_status: reportData.lab_report_status || 'PENDING',
        lab_remarks: reportData.lab_remarks || '',
      })
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch report')
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [id])

  const handleApprove = async () => {
    if (!id || !report) return
    
    const approverName = prompt('Enter your name to approve this report:')
    if (!approverName) return
    
    try {
      setApprovalLoading(true)
      await reportsAPI.approve(id, approverName)
      setSuccessMessage('Report approved successfully!')
      fetchReport() // Refresh report data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve report')
      console.error('Error approving report:', err)
    } finally {
      setApprovalLoading(false)
    }
  }

  const onSubmit = async (data: UpdateFormData) => {
    if (!id) return
    
    try {
      setUpdateLoading(true)
      await reportsAPI.update(id, data)
      setSuccessMessage('Report updated successfully!')
      fetchReport() // Refresh report data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update report')
      console.error('Error updating report:', err)
    } finally {
      setUpdateLoading(false)
    }
  }

  const onTestStatusSubmit = async (data: TestStatusUpdateData) => {
    if (!id || !report) return
    
    try {
      setTestStatusUpdateLoading(true)
      // Update the labtest via the reports endpoint - we need to create a new endpoint for this
      await reportsAPI.update(id, { 
        test_status: data.test_status,
        lab_report_status: data.lab_report_status,
        lab_remarks: data.lab_remarks || null
      })
      setSuccessMessage('Test status updated successfully!')
      fetchReport() // Refresh report data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update test status')
      console.error('Error updating test status:', err)
    } finally {
      setTestStatusUpdateLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'READY_FOR_APPROVAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800'
      case 'DISPATCHED':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTestStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLabReportStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button 
              onClick={() => navigate('/')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/receipts')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/receipts') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Receipts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/lab-tests')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/owner-track')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/owner-track') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Owner Track"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/invoices')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Invoices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 space-y-2">
            <button 
              onClick={() => navigate('/')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/receipts')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/receipts') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Receipts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/lab-tests')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/owner-track')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/owner-track') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Owner Track"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Reports"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/invoices')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
              title="Invoices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Report not found</p>
              <button
                onClick={() => navigate('/reports')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Back to Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-2 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/receipts')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/receipts') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Receipts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/lab-tests')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/lab-tests') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Lab Tests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/owner-track')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/owner-track') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Owner Track"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
            title="Reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/invoices')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/invoices') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            title="Invoices"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Report Details</h1>
        <button
          onClick={() => navigate('/reports')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Reports
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Report Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Information</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Report ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{report.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lab Test ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{report.labtest_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Retesting Requested</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {report.retesting_requested ? (
                <span className="text-red-600 font-medium">Yes</span>
              ) : (
                <span className="text-green-600 font-medium">No</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Final Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.final_status)}`}>
                {report.final_status.replace('_', ' ')}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Approved By</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.approved_by || 'Not approved'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Communication Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCommStatusBadgeClass(report.comm_status)}`}>
                {report.comm_status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Communication Channel</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.comm_channel.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Communicated to Accounts</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {report.communicated_to_accounts ? (
                <span className="text-green-600 font-medium">Yes</span>
              ) : (
                <span className="text-gray-600 font-medium">No</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(report.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(report.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Lab Test Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Lab Test Information</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Test Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTestStatusBadgeClass(report.test_status || 'PENDING')}`}>
                {(report.test_status || 'PENDING').replace('_', ' ')}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lab Report Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLabReportStatusBadgeClass(report.lab_report_status || 'PENDING')}`}>
                {(report.lab_report_status || 'PENDING').replace('_', ' ')}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lab Document No</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.lab_doc_no || 'Not assigned'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lab Person</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.lab_person || 'Not assigned'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Lab Remarks</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.lab_remarks || 'No remarks'}</dd>
          </div>
        </dl>
      </div>

      {/* Approval Action */}
      {report.final_status !== 'APPROVED' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Approval Action</h2>
          <button
            onClick={handleApprove}
            disabled={approvalLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {approvalLoading ? 'Approving...' : 'Approve Report'}
          </button>
        </div>
      )}

      {/* Update Communication Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Communication Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Communication Status */}
            <div>
              <label htmlFor="comm_status" className="block text-sm font-medium text-gray-700 mb-1">
                Communication Status
              </label>
              <select
                id="comm_status"
                {...register('comm_status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              {errors.comm_status && (
                <p className="mt-1 text-sm text-red-600">{errors.comm_status.message}</p>
              )}
            </div>

            {/* Communication Channel */}
            <div>
              <label htmlFor="comm_channel" className="block text-sm font-medium text-gray-700 mb-1">
                Communication Channel
              </label>
              <select
                id="comm_channel"
                {...register('comm_channel')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="EMAIL">Email</option>
                <option value="COURIER">Courier</option>
                <option value="IN_PERSON">In Person</option>
              </select>
              {errors.comm_channel && (
                <p className="mt-1 text-sm text-red-600">{errors.comm_channel.message}</p>
              )}
            </div>
          </div>

          {/* Communicated to Accounts */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('communicated_to_accounts')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Communicated to Accounts</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || updateLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isSubmitting || updateLoading ? 'Updating...' : 'Update Communication'}
            </button>
          </div>
        </form>
      </div>

      {/* Update Test Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Test Status</h2>
        <form onSubmit={handleTestStatusSubmit(onTestStatusSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="test_status" className="block text-sm font-medium text-gray-700">
                Test Status
              </label>
              <select
                {...registerTestStatus('test_status')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              {testStatusErrors.test_status && (
                <p className="mt-1 text-sm text-red-600">{testStatusErrors.test_status.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lab_report_status" className="block text-sm font-medium text-gray-700">
                Lab Report Status
              </label>
              <select
                {...registerTestStatus('lab_report_status')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
              </select>
              {testStatusErrors.lab_report_status && (
                <p className="mt-1 text-sm text-red-600">{testStatusErrors.lab_report_status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="lab_remarks" className="block text-sm font-medium text-gray-700">
              Lab Remarks
            </label>
            <textarea
              {...registerTestStatus('lab_remarks')}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter any remarks about the test..."
            />
            {testStatusErrors.lab_remarks && (
              <p className="mt-1 text-sm text-red-600">{testStatusErrors.lab_remarks.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isTestStatusSubmitting || testStatusUpdateLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isTestStatusSubmitting || testStatusUpdateLoading ? 'Updating...' : 'Update Test Status'}
            </button>
          </div>
        </form>
      </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportDetail
