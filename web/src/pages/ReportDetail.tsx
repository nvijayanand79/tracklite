import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { reportsAPI } from '../services/api'

const updateSchema = z.object({
  comm_status: z.enum(['PENDING', 'DISPATCHED', 'DELIVERED']),
  comm_channel: z.enum(['COURIER', 'IN_PERSON', 'EMAIL']),
  communicated_to_accounts: z.boolean(),
})

type UpdateFormData = z.infer<typeof updateSchema>

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
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Report not found</p>
        <button
          onClick={() => navigate('/reports')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Back to Reports
        </button>
      </div>
    )
  }

  return (
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
    </div>
  )
}

export default ReportDetail
