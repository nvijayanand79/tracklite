// Updated version of Receipts.tsx to use with @hookform/resolvers
// Replace the current implementation with this once you run: npm install @hookform/resolvers

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../services/api'

// Schema with conditional validation
const receiptSchema = z.object({
  receiverName: z.string().min(1, 'Receiver name is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  date: z.string().min(1, 'Date is required'),
  branch: z.string().min(1, 'Branch is required'),
  company: z.string().min(1, 'Company is required'),
  countOfBoxes: z.number().min(1, 'Count of boxes must be at least 1'),
  receivingMode: z.enum(['Person', 'Courier'], {
    required_error: 'Receiving mode is required',
  }),
  forwardToChennai: z.boolean(),
  awbNo: z.string().optional(),
}).refine((data) => {
  // AWB No is required if Receiving Mode = Courier OR (Branch != Chennai and Forward to Chennai = true)
  const needsAwb = data.receivingMode === 'Courier' || 
                   (data.branch !== 'Chennai' && data.forwardToChennai === true)
  
  if (needsAwb && (!data.awbNo || data.awbNo.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'AWB No is required when Receiving Mode is Courier or when Branch is not Chennai and Forward to Chennai is checked',
  path: ['awbNo']
})

type ReceiptFormData = z.infer<typeof receiptSchema>

export default function Receipts() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
      forwardToChennai: false,
    },
  })

  const watchReceivingMode = watch('receivingMode')
  const watchBranch = watch('branch')
  const watchForwardToChennai = watch('forwardToChennai')

  // Check if AWB No is required based on current form values
  const isAwbRequired = watchReceivingMode === 'Courier' || 
                       (watchBranch !== 'Chennai' && watchForwardToChennai === true)

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      const response = await api.post('/receipts', data)
      console.log('Receipt created successfully:', response.data)
      // You can add success handling here (e.g., toast notification, form reset)
    } catch (error) {
      console.error('Error creating receipt:', error)
      // You can add error handling here (e.g., toast notification)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Receipt</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Receiver Name */}
          <div>
            <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700 mb-1">
              Receiver Name *
            </label>
            <input
              type="text"
              id="receiverName"
              {...register('receiverName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.receiverName && (
              <p className="mt-1 text-sm text-red-600">{errors.receiverName.message}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="text"
              id="contactNumber"
              {...register('contactNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.contactNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              type="text"
              id="branch"
              {...register('branch')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              type="text"
              id="company"
              {...register('company')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          {/* Count of Boxes */}
          <div>
            <label htmlFor="countOfBoxes" className="block text-sm font-medium text-gray-700 mb-1">
              Count of Boxes *
            </label>
            <input
              type="number"
              id="countOfBoxes"
              min="1"
              {...register('countOfBoxes', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.countOfBoxes && (
              <p className="mt-1 text-sm text-red-600">{errors.countOfBoxes.message}</p>
            )}
          </div>

          {/* Receiving Mode */}
          <div>
            <label htmlFor="receivingMode" className="block text-sm font-medium text-gray-700 mb-1">
              Receiving Mode *
            </label>
            <select
              id="receivingMode"
              {...register('receivingMode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select receiving mode</option>
              <option value="Person">Person</option>
              <option value="Courier">Courier</option>
            </select>
            {errors.receivingMode && (
              <p className="mt-1 text-sm text-red-600">{errors.receivingMode.message}</p>
            )}
          </div>

          {/* Forward to Chennai */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="forwardToChennai"
              {...register('forwardToChennai')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="forwardToChennai" className="ml-2 block text-sm text-gray-700">
              Forward to Chennai
            </label>
          </div>

          {/* AWB No - conditionally shown */}
          {isAwbRequired && (
            <div>
              <label htmlFor="awbNo" className="block text-sm font-medium text-gray-700 mb-1">
                AWB No *
              </label>
              <input
                type="text"
                id="awbNo"
                {...register('awbNo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.awbNo && (
                <p className="mt-1 text-sm text-red-600">{errors.awbNo.message}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Receipt...' : 'Create Receipt'}
          </button>
        </form>
      </div>
    </div>
  )
}
