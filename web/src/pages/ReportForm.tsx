import React, { useState, useEffect } from 'react'
import NavigationBar from '../components/NavigationBar'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { reportsAPI, api } from '../services/api'

const reportSchema = z.object({
  labtest_id: z.string().min(1, 'Lab test is required'),
  retesting_requested: z.number().min(0).max(1),
  final_status: z.enum(['DRAFT', 'APPROVED']),
  approved_by: z.string().optional(),
  comm_status: z.enum(['PENDING', 'DELIVERED']),
  comm_channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  communicated_to_accounts: z.number().min(0).max(1),
}).refine((data) => {
  // If final_status is APPROVED, approved_by must be provided
  if (data.final_status === 'APPROVED' && !data.approved_by) {
    return false
  }
  return true
}, {
  message: 'Approved by is required when final status is APPROVED',
  path: ['approved_by']
})

type ReportFormData = z.infer<typeof reportSchema>

interface LabTest {
  id: string
  lab_doc_no: string
  lab_person: string
  test_status: string
}

const ReportForm: React.FC = () => {
  const navigate = useNavigate()
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      retesting_requested: 0,
      final_status: 'DRAFT',
      comm_status: 'PENDING',
      comm_channel: 'EMAIL',
      communicated_to_accounts: 0,
    }
  })

  const watchedFinalStatus = watch('final_status')

  // Fetch lab tests for the dropdown (only those without reports)
  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const response = await api.get('/labtests/available-for-reports')
        setLabTests(Array.isArray(response.data) ? response.data : [])
      } catch (err: any) {
        console.error('Error fetching lab tests:', err)
        setError('Failed to fetch lab tests')
        setLabTests([]) // Ensure it's always an array
      }
    }

    fetchLabTests()
  }, [])

  const onSubmit = async (data: ReportFormData) => {
    try {
      setLoading(true)
      setError('')
      
      await reportsAPI.create(data)
      navigate('/reports')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create report')
      console.error('Error creating report:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Create Report</h1>
        <button
          onClick={() => navigate('/reports')}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          ← Back to Reports
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Lab Test Selection */}
          <div>
            <label htmlFor="labtest_id" className="block text-sm font-medium text-gray-700 mb-1">
              Lab Test *
            </label>
            <select
              id="labtest_id"
              {...register('labtest_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
              disabled={!Array.isArray(labTests) || labTests.length === 0}
            >
              <option value="">
                {!Array.isArray(labTests) || labTests.length === 0 ? 'No lab tests available for reports' : 'Select a lab test'}
              </option>
              {Array.isArray(labTests) && labTests.map((labTest) => (
                <option key={labTest.id} value={labTest.id}>
                  {labTest.lab_doc_no} - {labTest.lab_person} ({labTest.test_status})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {!Array.isArray(labTests) || labTests.length === 0 
                ? 'All lab tests already have reports. Create new lab tests first.'
                : 'Only lab tests without existing reports are shown'
              }
            </p>
            {errors.labtest_id && (
              <p className="mt-1 text-sm text-red-600">{errors.labtest_id.message}</p>
            )}
          </div>

          {/* Retesting Requested */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('retesting_requested', {
                  setValueAs: (value) => value ? 1 : 0
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="ml-2 text-sm text-gray-700">Retesting Requested</span>
            </label>
          </div>

          {/* Final Status */}
          <div>
            <label htmlFor="final_status" className="block text-sm font-medium text-gray-700 mb-1">
              Final Status *
            </label>
            <select
              id="final_status"
              {...register('final_status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            >
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
            </select>
            {errors.final_status && (
              <p className="mt-1 text-sm text-red-600">{errors.final_status.message}</p>
            )}
          </div>

          {/* Approved By (conditionally required) */}
          {watchedFinalStatus === 'APPROVED' && (
            <div>
              <label htmlFor="approved_by" className="block text-sm font-medium text-gray-700 mb-1">
                Approved By *
              </label>
              <input
                type="text"
                id="approved_by"
                {...register('approved_by')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
                placeholder="Enter approver name"
              />
              {errors.approved_by && (
                <p className="mt-1 text-sm text-red-600">{errors.approved_by.message}</p>
              )}
            </div>
          )}

          {/* Communication Status */}
          <div>
            <label htmlFor="comm_status" className="block text-sm font-medium text-gray-700 mb-1">
              Communication Status *
            </label>
            <select
              id="comm_status"
              {...register('comm_status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            >
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
            </select>
            {errors.comm_status && (
              <p className="mt-1 text-sm text-red-600">{errors.comm_status.message}</p>
            )}
          </div>

          {/* Communication Channel */}
          <div>
            <label htmlFor="comm_channel" className="block text-sm font-medium text-gray-700 mb-1">
              Communication Channel *
            </label>
            <select
              id="comm_channel"
              {...register('comm_channel')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            {errors.comm_channel && (
              <p className="mt-1 text-sm text-red-600">{errors.comm_channel.message}</p>
            )}
          </div>

          {/* Communicated to Accounts */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('communicated_to_accounts', {
                  setValueAs: (value) => value ? 1 : 0
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="ml-2 text-sm text-gray-700">Communicated to Accounts</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting || loading ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  )
}

export default ReportForm
