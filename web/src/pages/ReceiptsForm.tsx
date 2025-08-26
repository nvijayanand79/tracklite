import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

// Form validation schema
const receiptSchema = z.object({
  receiver_name: z.string().min(1, 'Receiver name is required').max(255, 'Name too long'),
  contact_number: z.string().min(10, 'Contact number must be at least 10 digits').max(15, 'Contact number too long'),
  date: z.string().min(1, 'Date is required'),
  branch: z.string().min(1, 'Branch is required').max(100, 'Branch name too long'),
  company: z.string().min(1, 'Company is required').max(255, 'Company name too long'),
  count_of_boxes: z.number().min(1, 'Count must be at least 1'),
  receiving_mode: z.enum(['PERSON', 'COURIER'], {
    errorMap: () => ({ message: 'Please select a receiving mode' })
  }),
  forward_to_chennai: z.boolean(),
  awb_no: z.string().optional()
}).refine((data) => {
  // Business rule validation
  const needsAwb = 
    data.receiving_mode === 'COURIER' || 
    (data.branch.toLowerCase() !== 'chennai' && data.forward_to_chennai)
  
  if (needsAwb && (!data.awb_no || data.awb_no.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'AWB number is required when receiving mode is COURIER or when forwarding to Chennai from non-Chennai branch',
  path: ['awb_no']
})

type ReceiptFormData = z.infer<typeof receiptSchema>

export default function ReceiptsForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
      receiving_mode: 'PERSON',
      forward_to_chennai: false,
      count_of_boxes: 1
    }
  })

  // Watch form values for conditional logic
  const receivingMode = watch('receiving_mode')
  const branch = watch('branch')
  const forwardToChennai = watch('forward_to_chennai')
  
  // Determine if AWB is required
  const isAwbRequired = receivingMode === 'COURIER' || 
    (branch && branch.toLowerCase() !== 'chennai' && forwardToChennai)

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      setServerError(null)
      
      await api.post('/receipts', data)
      
      // Redirect to receipts list on success
      navigate('/receipts')
    } catch (error: any) {
      console.error('Receipt creation error:', error)
      
      if (error.response?.status === 400) {
        setServerError(error.response.data.detail || 'Validation error')
      } else if (error.response?.status === 401) {
        setServerError('You must be logged in to create receipts')
      } else {
        setServerError('Failed to create receipt. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">New Receipt</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new receipt for package tracking
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-600 text-sm">{serverError}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Receiver Name */}
            <div>
              <label htmlFor="receiver_name" className="block text-sm font-medium text-gray-700 mb-1">
                Receiver Name *
              </label>
              <input
                id="receiver_name"
                type="text"
                {...register('receiver_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter receiver name"
              />
              {errors.receiver_name && (
                <p className="mt-1 text-sm text-red-600">{errors.receiver_name.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                id="contact_number"
                type="tel"
                {...register('contact_number')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact number"
              />
              {errors.contact_number && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_number.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Branch */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                Branch *
              </label>
              <input
                id="branch"
                type="text"
                {...register('branch')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter branch location"
              />
              {errors.branch && (
                <p className="mt-1 text-sm text-red-600">{errors.branch.message}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                id="company"
                type="text"
                {...register('company')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>

            {/* Count of Boxes */}
            <div>
              <label htmlFor="count_of_boxes" className="block text-sm font-medium text-gray-700 mb-1">
                Count of Boxes *
              </label>
              <input
                id="count_of_boxes"
                type="number"
                min="1"
                {...register('count_of_boxes', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of boxes"
              />
              {errors.count_of_boxes && (
                <p className="mt-1 text-sm text-red-600">{errors.count_of_boxes.message}</p>
              )}
            </div>
          </div>

          {/* Receiving Mode */}
          <div>
            <label htmlFor="receiving_mode" className="block text-sm font-medium text-gray-700 mb-1">
              Receiving Mode *
            </label>
            <select
              id="receiving_mode"
              {...register('receiving_mode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PERSON">Person</option>
              <option value="COURIER">Courier</option>
            </select>
            {errors.receiving_mode && (
              <p className="mt-1 text-sm text-red-600">{errors.receiving_mode.message}</p>
            )}
          </div>

          {/* Forward to Chennai */}
          <div className="flex items-center">
            <input
              id="forward_to_chennai"
              type="checkbox"
              {...register('forward_to_chennai')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="forward_to_chennai" className="ml-2 block text-sm text-gray-900">
              Forward to Chennai
            </label>
          </div>

          {/* Courier AWB */}
          <div>
            <label htmlFor="awb_no" className="block text-sm font-medium text-gray-700 mb-1">
              Courier AWB Number {isAwbRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              id="awb_no"
              type="text"
              {...register('awb_no')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isAwbRequired ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter AWB number (required for courier or non-Chennai forwarding)"
            />
            {errors.awb_no && (
              <p className="mt-1 text-sm text-red-600">{errors.awb_no.message}</p>
            )}
            {isAwbRequired && (
              <p className="mt-1 text-sm text-blue-600">
                AWB number is required for this configuration
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/receipts')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Receipt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
