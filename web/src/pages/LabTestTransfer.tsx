import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';

// Validation schema
const transferSchema = z.object({
  from_user: z.string().min(1, 'From user is required'),
  to_user: z.string().min(1, 'To user is required'),
  reason: z.string().min(1, 'Transfer reason is required').max(500, 'Reason must be 500 characters or less')
});

type TransferFormData = z.infer<typeof transferSchema>;

interface LabTest {
  id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: string;
  lab_report_status: string;
}

const LabTestTransfer: React.FC = () => {
  const { labTestId } = useParams<{ labTestId: string }>();
  const [labTest, setLabTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema)
  });

  useEffect(() => {
    fetchLabTest();
  }, [labTestId]);

  const fetchLabTest = async () => {
    if (!labTestId) {
      setError('Lab test ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/labtests/${labTestId}`);
      const labTestData = response.data;
      setLabTest(labTestData);
      
      // Pre-fill the from_user with current lab_person
      setValue('from_user', labTestData.lab_person);
      
    } catch (err: any) {
      console.error('Error fetching lab test:', err);
      if (err.response?.status === 404) {
        setError('Lab test not found');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch lab test details');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TransferFormData) => {
    if (!labTest) return;

    try {
      setSubmitting(true);
      setError(null);

      // Validate that from_user and to_user are different
      if (data.from_user.trim() === data.to_user.trim()) {
        setError('From user and To user cannot be the same');
        return;
      }

      await api.post(`/labtests/${labTest.id}/transfer`, data);
      
      // Navigate back to lab test detail
      navigate(`/lab-tests/${labTest.id}`);
    } catch (err: any) {
      console.error('Error transferring lab test:', err);
      setError(err.response?.data?.detail || 'Failed to transfer lab test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !labTest) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => navigate('/lab-tests')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Back to Lab Tests
          </button>
        </div>
      </div>
    );
  }

  if (!labTest) {
    return null;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transfer Lab Test</h1>
        <p className="text-gray-600 mt-2">Transfer lab test ownership from one person to another</p>
      </div>

      {/* Lab Test Information */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Lab Test Details</h3>
        <div className="text-sm text-blue-800">
          <p><strong>Lab Document:</strong> {labTest.lab_doc_no}</p>
          <p><strong>Current Lab Person:</strong> {labTest.lab_person}</p>
          <p><strong>Test Status:</strong> {labTest.test_status}</p>
          <p><strong>Report Status:</strong> {labTest.lab_report_status}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* From User */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From User (Current Lab Person) *
          </label>
          <input
            type="text"
            {...register('from_user')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />
          {errors.from_user && (
            <p className="mt-1 text-sm text-red-600">{errors.from_user.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This is automatically filled with the current lab person
          </p>
        </div>

        {/* To User */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To User (New Lab Person) *
          </label>
          <input
            type="text"
            {...register('to_user')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the name of the person to transfer to"
          />
          {errors.to_user && (
            <p className="mt-1 text-sm text-red-600">{errors.to_user.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Reason *
          </label>
          <textarea
            {...register('reason')}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the reason for this transfer (e.g., workload balancing, staff change, expertise requirements, etc.)"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Provide a clear reason for the transfer for audit purposes
          </p>
        </div>

        {/* Transfer Impact Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Transfer Impact
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>The lab person will be updated to the new user</li>
                  <li>This transfer will be logged in the lab test's history</li>
                  <li>All future communications should be directed to the new person</li>
                  <li>The original person will no longer be responsible for this lab test</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Transferring...' : 'Transfer Lab Test'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/lab-tests/${labTest.id}`)}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabTestTransfer;
