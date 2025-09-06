import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Define types
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
}

interface Receipt {
  id: string;
  tracking_number: string;
  consigner_name: string;
  branch: string;
}

const LabTestsList: React.FC = () => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [receipts, setReceipts] = useState<{ [key: string]: Receipt }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    try {
      setLoading(true);
      setError(null);
      
      // Fetch lab tests
      const labTestsResponse = await api.get('/labtests');
      const labTestsData = labTestsResponse.data;
      setLabTests(labTestsData);

      // Fetch receipts for lab tests
      const receiptsResponse = await api.get('/receipts');
      const receiptsData = receiptsResponse.data;
      
      // Create receipts lookup map
      const receiptsMap: { [key: string]: Receipt } = {};
      receiptsData.forEach((receipt: Receipt) => {
        receiptsMap[receipt.id] = receipt;
      });
      setReceipts(receiptsMap);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLabTests = labTests.filter(labTest => {
    if (statusFilter === 'all') return true;
    return labTest.test_status === statusFilter;
  });

  const handleLabTestClick = (labTestId: string) => {
    navigate(`/lab-tests/${labTestId}`);
  };

  const handleUpdateStatus = async (labTestId: string, newStatus: string, field: 'test_status' | 'lab_report_status') => {
    try {
      const updateData = {
        [field]: newStatus
      };
      
      await api.patch(`/labtests/${labTestId}`, updateData);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.detail || 'Failed to update status');
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

  return (
    <>
      <NavigationBar />
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lab Tests</h1>
        <button
          onClick={() => navigate('/lab-tests/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Lab Test
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Test Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="QUEUED">Queued</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      {/* Lab Tests Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLabTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {statusFilter === 'all' ? 'No lab tests found' : `No lab tests found with status: ${statusFilter}`}
                  </td>
                </tr>
              ) : (
                filteredLabTests.map((labTest) => {
                  const receipt = receipts[labTest.receipt_id];
                  return (
                    <tr key={labTest.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {labTest.lab_doc_no}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {receipt ? (
                            <div>
                              <div className="font-medium">{receipt.tracking_number}</div>
                              <div className="text-gray-500">{receipt.consigner_name}</div>
                              <div className="text-gray-500 text-xs">{receipt.branch}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Loading...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{labTest.lab_person}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={labTest.test_status}
                          onChange={(e) => handleUpdateStatus(labTest.id, e.target.value, 'test_status')}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(labTest.test_status)}`}
                        >
                          <option value="QUEUED">Queued</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="ON_HOLD">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={labTest.lab_report_status}
                          onChange={(e) => handleUpdateStatus(labTest.id, e.target.value, 'lab_report_status')}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(labTest.lab_report_status)}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="DRAFT">Draft</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="FINALIZED">Finalized</option>
                          <option value="SENT">Sent</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(labTest.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleLabTestClick(labTest.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/lab-tests/${labTest.id}/transfer`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{labTests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Queued</div>
          <div className="text-2xl font-bold text-gray-900">
            {labTests.filter(lt => lt.test_status === 'QUEUED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">
            {labTests.filter(lt => lt.test_status === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {labTests.filter(lt => lt.test_status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">On Hold</div>
          <div className="text-2xl font-bold text-yellow-600">
            {labTests.filter(lt => lt.test_status === 'ON_HOLD').length}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default LabTestsList;
