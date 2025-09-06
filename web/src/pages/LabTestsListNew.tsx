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
  test_status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NEEDS_RETEST' | 'ON_HOLD';
  lab_report_status: 'NOT_STARTED' | 'DRAFT' | 'READY' | 'SIGNED_OFF';
  remarks?: string;
  created_at: string;
  updated_at: string;
}

interface Receipt {
  id: string;
  tracking_number?: string;
  receiver_name: string;
  branch: string;
  company: string;
  awb_no?: string;
}

const LabTestsList: React.FC = () => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [receipts, setReceipts] = useState<{ [key: string]: Receipt }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Status badge mapping with professional colors
  const getTestStatusBadge = (status: string) => {
    const statusMap = {
      'QUEUED': 'badge-secondary',
      'IN_PROGRESS': 'badge-info',
      'COMPLETED': 'badge-success',
      'FAILED': 'badge-danger',
      'NEEDS_RETEST': 'badge-warning',
      'ON_HOLD': 'badge-warning'
    };
    return statusMap[status as keyof typeof statusMap] || 'badge-secondary';
  };

  const getReportStatusBadge = (status: string) => {
    const statusMap = {
      'NOT_STARTED': 'badge-secondary',
      'DRAFT': 'badge-warning',
      'READY': 'badge-info',
      'SIGNED_OFF': 'badge-success'
    };
    return statusMap[status as keyof typeof statusMap] || 'badge-secondary';
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
      
      await api.put(`/labtests/${labTestId}`, updateData);
      
      // Refresh data
      await fetchData();
      
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <>
        <NavigationBar />
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 p-6">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="page-header">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="page-title">Laboratory Tests</h1>
                <p className="page-subtitle">Manage and track laboratory test processes</p>
              </div>
              <button
                onClick={() => navigate('/lab-tests/new')}
                className="btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Lab Test
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-800 animate-slide-up">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-danger-600 hover:text-danger-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 text-secondary-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span className="font-medium">Filter by Status</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field min-w-48"
              >
                <option value="all">All Status</option>
                <option value="QUEUED">Queued</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="NEEDS_RETEST">Needs Retest</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
              <div className="text-sm text-secondary-600">
                Showing {filteredLabTests.length} of {labTests.length} tests
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Total Tests</p>
                  <p className="text-3xl font-bold text-secondary-900">{labTests.length}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">In Progress</p>
                  <p className="text-3xl font-bold text-info-600">
                    {labTests.filter(t => t.test_status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className="p-3 bg-info-100 rounded-xl">
                  <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Completed</p>
                  <p className="text-3xl font-bold text-success-600">
                    {labTests.filter(t => t.test_status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="p-3 bg-success-100 rounded-xl">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Reports Ready</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {labTests.filter(t => t.lab_report_status === 'READY' || t.lab_report_status === 'SIGNED_OFF').length}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Lab Tests Table */}
          <div className="table-container">
            <div className="table-header">
              <h3 className="text-lg font-semibold text-secondary-900">Laboratory Test Records</h3>
            </div>
            
            {filteredLabTests.length === 0 ? (
              <div className="p-12 text-center text-secondary-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-lg font-medium mb-2">No lab tests found</p>
                <p className="text-sm">
                  {statusFilter === 'all' 
                    ? 'Get started by creating your first lab test' 
                    : `No lab tests found with status: ${statusFilter}`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Lab Doc No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Receipt Info</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Lab Person</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Test Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Report Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLabTests.map((labTest) => {
                      const receipt = receipts[labTest.receipt_id];
                      return (
                        <tr key={labTest.id} className="table-row">
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm bg-secondary-100 px-2 py-1 rounded inline-block">
                              {labTest.lab_doc_no}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {receipt ? (
                              <div>
                                <div className="font-medium text-secondary-900">{receipt.receiver_name}</div>
                                <div className="text-sm text-secondary-600">{receipt.company}</div>
                                <div className="text-xs text-secondary-500">{receipt.branch}</div>
                              </div>
                            ) : (
                              <span className="text-secondary-400">Receipt not found</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-secondary-900">{labTest.lab_person}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={labTest.test_status}
                              onChange={(e) => handleUpdateStatus(labTest.id, e.target.value, 'test_status')}
                              className={`text-xs px-3 py-1 rounded-full font-medium border-none ${getTestStatusBadge(labTest.test_status)}`}
                            >
                              <option value="QUEUED">Queued</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="FAILED">Failed</option>
                              <option value="NEEDS_RETEST">Needs Retest</option>
                              <option value="ON_HOLD">On Hold</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={labTest.lab_report_status}
                              onChange={(e) => handleUpdateStatus(labTest.id, e.target.value, 'lab_report_status')}
                              className={`text-xs px-3 py-1 rounded-full font-medium border-none ${getReportStatusBadge(labTest.lab_report_status)}`}
                            >
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="DRAFT">Draft</option>
                              <option value="READY">Ready</option>
                              <option value="SIGNED_OFF">Signed Off</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-secondary-600">
                              {new Date(labTest.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLabTestClick(labTest.id)}
                                className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => navigate(`/lab-tests/${labTest.id}/edit`)}
                                className="p-2 text-secondary-600 hover:text-success-600 hover:bg-success-50 rounded-lg transition-all duration-200"
                                title="Edit Test"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-secondary-500">
            Total: {labTests.length} test{labTests.length !== 1 ? 's' : ''} • Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
};

export default LabTestsList;
