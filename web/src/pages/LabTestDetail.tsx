import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Define types
interface LabTransfer {
  id: string;
  from_user: string;
  to_user: string;
  reason: string;
  transfer_date: string;
}

interface LabTest {
  id: string;
  receipt_id: string;
  lab_doc_no: string;
  lab_person: string;
  test_status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  lab_report_status: 'PENDING' | 'DRAFT' | 'REVIEWED' | 'FINALIZED' | 'SENT';
  remarks?: string;
  created_at: string;
  updated_at: string;
  transfers: LabTransfer[];
}

interface Receipt {
  id: string;
  tracking_number: string;
  consigner_name: string;
  branch: string;
  total_amount: number;
}

const LabTestDetail: React.FC = () => {
  const { labTestId } = useParams<{ labTestId: string }>();
  const [labTest, setLabTest] = useState<LabTest | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      'QUEUED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800', 
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-gray-100 text-gray-800',
      'DRAFT': 'bg-yellow-100 text-yellow-800',
      'REVIEWED': 'bg-blue-100 text-blue-800',
      'FINALIZED': 'bg-green-100 text-green-800',
      'SENT': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const fetchData = async () => {
    if (!labTestId) {
      setError('Lab test ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch lab test with transfers
      const labTestResponse = await api.get(`/labtests/${labTestId}`);
      const labTestData = labTestResponse.data;
      setLabTest(labTestData);

      // Fetch associated receipt
      const receiptResponse = await api.get(`/receipts/${labTestData.receipt_id}`);
      setReceipt(receiptResponse.data);
      
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

  useEffect(() => {
    fetchData();
  }, [labTestId]);

  const handleStatusUpdate = async (field: 'test_status' | 'lab_report_status', newStatus: string) => {
    if (!labTest) return;

    try {
      setUpdating(true);
      setError(null);
      
      const updateData = {
        [field]: newStatus
      };
      
      await api.patch(`/labtests/${labTest.id}`, updateData);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemarksUpdate = async (newRemarks: string) => {
    if (!labTest) return;

    try {
      setUpdating(true);
      setError(null);
      
      const updateData = {
        remarks: newRemarks.trim() || null
      };
      
      await api.patch(`/labtests/${labTest.id}`, updateData);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Error updating remarks:', err);
      setError(err.response?.data?.detail || 'Failed to update remarks');
    } finally {
      setUpdating(false);
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

  if (error) {
    return (
      <div className="p-6">
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lab Test Details</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/lab-tests/${labTest.id}/transfer`)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Transfer Lab Test
          </button>
          <button
            onClick={() => navigate('/lab-tests')}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Test Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Test Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Lab Document Number</label>
              <p className="text-lg font-medium text-gray-900">{labTest.lab_doc_no}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Lab Person</label>
              <p className="text-gray-900">{labTest.lab_person}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Test Status</label>
              <select
                value={labTest.test_status}
                onChange={(e) => handleStatusUpdate('test_status', e.target.value)}
                disabled={updating}
                className={`px-3 py-2 rounded-md border-0 text-sm font-medium ${getStatusColor(labTest.test_status)} disabled:opacity-50`}
              >
                <option value="QUEUED">Queued</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Lab Report Status</label>
              <select
                value={labTest.lab_report_status}
                onChange={(e) => handleStatusUpdate('lab_report_status', e.target.value)}
                disabled={updating}
                className={`px-3 py-2 rounded-md border-0 text-sm font-medium ${getStatusColor(labTest.lab_report_status)} disabled:opacity-50`}
              >
                <option value="PENDING">Pending</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="FINALIZED">Finalized</option>
                <option value="SENT">Sent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">{new Date(labTest.created_at).toLocaleString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{new Date(labTest.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Receipt Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Associated Receipt</h2>
          
          {receipt ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Tracking Number</label>
                <p className="text-lg font-medium text-gray-900">{receipt.tracking_number}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Consigner Name</label>
                <p className="text-gray-900">{receipt.consigner_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{receipt.branch}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-gray-900">${receipt.total_amount.toFixed(2)}</p>
              </div>
              
              <button
                onClick={() => navigate(`/receipts/${receipt.id}`)}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Receipt Details →
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Loading receipt information...</p>
          )}
        </div>
      </div>

      {/* Remarks Section */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h2>
        <div className="space-y-4">
          <textarea
            defaultValue={labTest.remarks || ''}
            onBlur={(e) => {
              if (e.target.value !== (labTest.remarks || '')) {
                handleRemarksUpdate(e.target.value);
              }
            }}
            disabled={updating}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Add remarks or notes..."
          />
          <p className="text-sm text-gray-500">
            Click outside the text area to save changes
          </p>
        </div>
      </div>

      {/* Transfer History */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer History</h2>
        
        {labTest.transfers && labTest.transfers.length > 0 ? (
          <div className="space-y-4">
            {labTest.transfers.map((transfer) => (
              <div key={transfer.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      From: <span className="text-blue-600">{transfer.from_user}</span> → 
                      To: <span className="text-green-600">{transfer.to_user}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{transfer.reason}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.transfer_date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No transfers recorded for this lab test.</p>
        )}
      </div>
    </div>
  );
};

export default LabTestDetail;
