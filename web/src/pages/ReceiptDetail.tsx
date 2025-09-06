import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import { api } from '../services/api';

interface Receipt {
  id: string;
  receiver_name: string;
  contact_number: string;
  date: string;
  branch: string;
  company: string;
  count_of_boxes: number;
  receiving_mode: string;
  forward_to_chennai: boolean;
  awb_no?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = async () => {
    if (!id) {
      setError('No receipt ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/receipts/${id}`);
      setReceipt(response.data);
      
    } catch (err: any) {
      console.error('Error fetching receipt:', err);
      if (err.response?.status === 404) {
        setError('Receipt not found');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch receipt details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <>
        <NavigationBar />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading receipt details...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavigationBar />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/receipts')}
                      className="bg-red-100 px-3 py-2 rounded text-red-800 hover:bg-red-200"
                    >
                      ← Back to Receipts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!receipt) {
    return (
      <>
        <NavigationBar />
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-600">Receipt not found</p>
            <button
              onClick={() => navigate('/receipts')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ← Back to Receipts
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
              <p className="text-sm text-gray-600">Tracking Number: {receipt.tracking_number || receipt.awb_no || '—'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/receipts')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to List
              </button>
              <button
                onClick={() => navigate(`/receipts/${receipt.id}/edit`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Edit Receipt
              </button>
            </div>
          </div>

          {/* Receipt Information Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Basic Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Receiver Name</dt>
                    <dd className="text-sm text-gray-900">{receipt.receiver_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Contact Number</dt>
                    <dd className="text-sm text-gray-900">{receipt.contact_number}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Date</dt>
                    <dd className="text-sm text-gray-900">{new Date(receipt.date).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Branch</dt>
                    <dd className="text-sm text-gray-900">{receipt.branch}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Company</dt>
                    <dd className="text-sm text-gray-900">{receipt.company}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Shipping Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Number of Boxes</dt>
                    <dd className="text-sm text-gray-900">{receipt.count_of_boxes}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Receiving Mode</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.receiving_mode === 'COURIER' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {receipt.receiving_mode}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Forward to Chennai</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.forward_to_chennai 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {receipt.forward_to_chennai ? 'Yes' : 'No'}
                      </span>
                    </dd>
                  </div>
                  {receipt.awb_no && (
                    <div>
                      <dt className="text-sm font-medium text-gray-700">AWB Number</dt>
                      <dd className="text-sm text-gray-900">{receipt.awb_no}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Tracking Number</dt>
                    <dd className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {receipt.tracking_number}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-700">Created At</dt>
                <dd className="text-sm text-gray-900">{new Date(receipt.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">Last Updated</dt>
                <dd className="text-sm text-gray-900">{new Date(receipt.updated_at).toLocaleString()}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptDetail;
