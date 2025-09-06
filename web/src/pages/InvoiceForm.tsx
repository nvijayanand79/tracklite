import React, { useState, useEffect } from 'react'
import NavigationBar from '../components/NavigationBar'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { invoicesAPI, reportsAPI } from '../services/api'

const invoiceSchema = z.object({
  report_id: z.string().min(1, 'Report is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface Report {
  id: string
  labtest_id: string
  final_status: string
  approved_by: string | null
  created_at: string
}

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate()
  const [approvedReports, setApprovedReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      amount: 0,
    }
  })

  // Fetch approved reports for the dropdown
  useEffect(() => {
    const fetchApprovedReports = async () => {
      try {
        const response = await reportsAPI.list({ final_status: 'APPROVED' })
        setApprovedReports(response.data)
      } catch (err: any) {
        console.error('Error fetching approved reports:', err)
        setError('Failed to fetch approved reports')
      }
    }

    fetchApprovedReports()
  }, [])

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setLoading(true)
      setError('')
      
      await invoicesAPI.create(data)
      navigate('/invoices')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create invoice')
      console.error('Error creating invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <button
          onClick={() => navigate('/invoices')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Invoices
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Report Selection */}
          <div>
            <label htmlFor="report_id" className="block text-sm font-medium text-gray-700 mb-1">
              Approved Report *
            </label>
            <select
              id="report_id"
              {...register('report_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an approved report</option>
              {approvedReports.map((report) => (
                <option key={report.id} value={report.id}>
                  Report {report.id.slice(0, 8)}... - Lab Test {report.labtest_id.slice(0, 8)}... 
                  (Approved by: {report.approved_by})
                </option>
              ))}
            </select>
            {errors.report_id && (
              <p className="mt-1 text-sm text-red-600">{errors.report_id.message}</p>
            )}
            {approvedReports.length === 0 && !error && (
              <p className="mt-1 text-sm text-yellow-600">
                No approved reports available. Reports must be approved before invoices can be created.
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading || approvedReports.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting || loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Invoice Creation Rules
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Invoices can only be created for reports with "APPROVED" status</li>
                <li>Each approved report can have only one invoice</li>
                <li>Invoice numbers are automatically generated in format INV-YYYY-NNNN</li>
                <li>Amount must be greater than $0.00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export default InvoiceForm
