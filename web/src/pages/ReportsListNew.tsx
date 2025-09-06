import React, { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'
import { reportsAPI } from '../services/api'

interface Report {
  id: string
  receipt_id: string
  report_no: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DRAFT'
  findings: string
  recommendations: string
  technician_name: string
  reviewed_by?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.list()
      setReports(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (id: string, status: string) => {
    try {
      await reportsAPI.update(id, { status })
      await fetchReports() // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    const statusMap = {
      'DRAFT': 'badge-secondary',
      'IN_PROGRESS': 'badge-warning',
      'COMPLETED': 'badge-success'
    }
    return statusMap[status as keyof typeof statusMap] || 'badge-secondary'
  }

  const filteredReports = reports.filter(report =>
    statusFilter === '' || report.status === statusFilter
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Reports"
          subtitle="Loading reports..."
          showBackButton={false}
        />
        <div className="pl-16">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Reports"
        subtitle="Manage laboratory test reports and findings"
        showBackButton={false}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reports' }
        ]}
        actions={
          <Link
            to="/reports/new"
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Report
          </Link>
        }
      />
      <div className="pl-16">
        <div className="max-w-7xl mx-auto p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            {filteredReports.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No reports found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.report_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.receipt_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.technician_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/reports/${report.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </Link>
                          {report.status !== 'COMPLETED' && (
                            <button
                              onClick={() => updateReportStatus(report.id, 'COMPLETED')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsList
