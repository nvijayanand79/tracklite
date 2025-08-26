import React, { useState, useEffect } from 'react';
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
  test_status: z.enum(['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  lab_report_status: z.enum(['PENDING', 'DRAFT', 'REVIEWED', 'FINALIZED', 'SENT']),
  remarks: z.string().max(500, 'Remarks must be 500 characters or less').optional()
});

type LabTestFormData = z.infer<typeof labTestSchema>;

interface Receipt {
  id: string;
  tracking_number: string;
  consigner_name: string;
  branch: string;
  total_amount: number;
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
      test_status: 'QUEUED',
      lab_report_status: 'PENDING'
    }
  });

  const selectedReceiptId = watch('receipt_id');
  const selectedReceipt = receipts.find(r => r.id === selectedReceiptId);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receipts');
      setReceipts(response.data);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError('Failed to fetch receipts');
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Lab Test</h1>
        <p className="text-gray-600 mt-2">Link a new lab test to an existing receipt</p>
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a receipt...</option>
            {receipts.map((receipt) => (
              <option key={receipt.id} value={receipt.id}>
                {receipt.tracking_number} - {receipt.consigner_name} ({receipt.branch})
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
              <p><strong>Tracking:</strong> {selectedReceipt.tracking_number}</p>
              <p><strong>Consigner:</strong> {selectedReceipt.consigner_name}</p>
              <p><strong>Branch:</strong> {selectedReceipt.branch}</p>
              <p><strong>Amount:</strong> ${selectedReceipt.total_amount.toFixed(2)}</p>
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="QUEUED">Queued</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ON_HOLD">On Hold</option>
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="FINALIZED">Finalized</option>
            <option value="SENT">Sent</option>
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Lab Test'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/lab-tests')}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabTestForm;
