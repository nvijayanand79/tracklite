import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  test_status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NEEDS_RETEST' | 'ON_HOLD';
  lab_report_status: 'NOT_STARTED' | 'DRAFT' | 'READY' | 'SIGNED_OFF';
  remarks?: string;
  created_at: string;
  updated_at: string;
  transfers: LabTransfer[];
}

interface Receipt {
  id: string;
  tracking_number?: string;
  receiver_name: string;
  branch: string;
  company: string;
  awb_no?: string;
}

const LabTestDetail: React.FC = () => {
  const { labTestId } = useParams<{ labTestId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [labTest, setLabTest] = useState<LabTest | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      'QUEUED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800', 
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'NEEDS_RETEST': 'bg-orange-100 text-orange-800',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800',
      'NOT_STARTED': 'bg-gray-100 text-gray-800',
      'DRAFT': 'bg-yellow-100 text-yellow-800',
      'READY': 'bg-blue-100 text-blue-800',
      'SIGNED_OFF': 'bg-green-100 text-green-800'
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
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
              className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
              title="Lab Tests"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
                location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
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
        </div>
      </div>
    );
  }

  if (!labTest) {
    return null;
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
            className="w-12 h-12 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg transition-colors group relative"
            title="Lab Tests"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/reports')}
            className={`w-12 h-12 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative ${
              location.pathname.includes('/reports') ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
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
          <div className="max-w-4xl mx-auto">
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
                <option value="FAILED">Failed</option>
                <option value="NEEDS_RETEST">Needs Retest</option>
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
                <option value="NOT_STARTED">Not Started</option>
                <option value="DRAFT">Draft</option>
                <option value="READY">Ready</option>
                <option value="SIGNED_OFF">Signed Off</option>
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
                <label className="block text-sm font-medium text-gray-500">Receiver Name</label>
                <p className="text-gray-900">{receipt.receiver_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{receipt.branch}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{receipt.company}</p>
              </div>
              
              {receipt.awb_no && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">AWB Number</label>
                  <p className="text-gray-900">{receipt.awb_no}</p>
                </div>
              )}
              
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
        </div>
      </div>
    </div>
  );
};

export default LabTestDetail;
