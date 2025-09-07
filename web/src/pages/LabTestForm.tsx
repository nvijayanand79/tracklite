import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';

// Validation schema
const labTestSchema = z.object({
  receipt_id: z.string().min(1, 'Receipt is required'),
  lab_doc_no: z.string()
    .min(1, 'Lab document number is required')
    .max(50, 'Lab document number must be 50 characters or less'),
  lab_person: z.string()
    .min(1, 'Lab person is required')
    .max(100, 'Lab person name must be 100 characters or less'),
  test_status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  lab_report_status: z.enum(['NOT_STARTED', 'DRAFT', 'READY', 'SIGNED_OFF']),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional()
});

type LabTestFormData = z.infer<typeof labTestSchema>;

interface Receipt {
  id: string;
  courier_awb?: string;
  receiver_name: string;
  branch: string;
  company: string;
  contact_number: string;
  count_boxes: number;
  receiving_mode: string;
}

const LabTestForm: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LabTestFormData>({
    resolver: zodResolver(labTestSchema),
    defaultValues: {
      test_status: 'IN_PROGRESS',
      lab_report_status: 'NOT_STARTED'
    }
  });

  const selectedReceiptId = watch('receipt_id');
  const selectedReceipt = Array.isArray(receipts) ? receipts.find(r => r.id === selectedReceiptId) : null;

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receipts');
      console.log('📄 Receipts API response:', response.data);
      // Ensure we always have an array
      const receiptsData = Array.isArray(response.data) ? response.data : [];
      console.log('📄 Processed receipts data:', receiptsData);
      setReceipts(receiptsData);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError('Failed to fetch receipts');
      setReceipts([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LabTestFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      // Remove empty remarks field
      const submitData = { ...data };
      if (!submitData.remarks?.trim()) {
        delete submitData.remarks;
      }

      await api.post('/labtests', submitData);
      
      // Navigate back to lab tests list
      navigate('/lab-tests');
    } catch (err: any) {
      console.error('Error creating lab test:', err);
      setError(err.response?.data?.detail || 'Failed to create lab test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 leading-tight mb-2">Create New Lab Test</h1>
        <p className="text-base text-gray-600 leading-relaxed">Link a new lab test to an existing receipt</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Receipt Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt *
          </label>
          <select
            {...register('receipt_id')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            disabled={loading || !Array.isArray(receipts) || receipts.length === 0}
          >
            <option value="">
              {loading ? 'Loading receipts...' : 
               !Array.isArray(receipts) || receipts.length === 0 ? 'No receipts available' : 
               'Select a receipt...'}
            </option>
            {Array.isArray(receipts) && receipts.map((receipt) => (
              <option key={receipt.id} value={receipt.id}>
                {receipt.courier_awb || 'No AWB'} - {receipt.receiver_name} ({receipt.branch})
              </option>
            ))}
          </select>
          {errors.receipt_id && (
            <p className="mt-1 text-sm text-red-600">{errors.receipt_id.message}</p>
          )}
        </div>

        {/* Selected Receipt Details */}
        {selectedReceipt && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Receipt Details</h3>
            <div className="text-sm text-blue-800">
              <p><strong>AWB/Tracking:</strong> {selectedReceipt.courier_awb || 'Not assigned'}</p>
              <p><strong>Receiver:</strong> {selectedReceipt.receiver_name}</p>
              <p><strong>Branch:</strong> {selectedReceipt.branch}</p>
              <p><strong>Company:</strong> {selectedReceipt.company}</p>
              <p><strong>Contact:</strong> {selectedReceipt.contact_number}</p>
              <p><strong>Boxes:</strong> {selectedReceipt.count_boxes}</p>
              <p><strong>Mode:</strong> {selectedReceipt.receiving_mode}</p>
            </div>
          </div>
        )}

        {/* Lab Document Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Document Number *
          </label>
          <input
            type="text"
            {...register('lab_doc_no')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            placeholder="Enter lab document number"
          />
          {errors.lab_doc_no && (
            <p className="mt-1 text-sm text-red-600">{errors.lab_doc_no.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Must be unique within the selected receipt's branch
          </p>
        </div>

        {/* Lab Person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Person *
          </label>
          <input
            type="text"
            {...register('lab_person')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            placeholder="Enter lab person name"
          />
          {errors.lab_person && (
            <p className="mt-1 text-sm text-red-600">{errors.lab_person.message}</p>
          )}
        </div>

        {/* Test Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Status *
          </label>
          <select
            {...register('test_status')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
          >
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {errors.test_status && (
            <p className="mt-1 text-sm text-red-600">{errors.test_status.message}</p>
          )}
        </div>

        {/* Lab Report Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Report Status *
          </label>
          <select
            {...register('lab_report_status')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="SIGNED_OFF">Signed Off</option>
          </select>
          {errors.lab_report_status && (
            <p className="mt-1 text-sm text-red-600">{errors.lab_report_status.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base min-h-[88px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-offset-2"
            placeholder="Optional remarks or notes..."
          />
          {errors.remarks && (
            <p className="mt-1 text-sm text-red-600">{errors.remarks.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting || loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {submitting ? 'Creating...' : 'Create Lab Test'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/lab-tests')}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default LabTestForm;
