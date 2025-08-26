import { Link, useNavigate } from 'react-router-dom'
import { authUtils } from './pages/Login'

export default function App() {
  const navigate = useNavigate()
  const isAuthenticated = authUtils.isAuthenticated()

  const handleLogout = () => {
    authUtils.removeToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">TraceLite — Internal Dashboard</h1>
      
      {isAuthenticated ? (
        <>
          <p className="text-gray-600">Welcome back! Select an option below to continue.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a className="px-4 py-2 rounded bg-sky-500 text-white hover:bg-sky-600 transition-colors" href="/owner/track">
              Owner Track
            </a>
            <Link className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors" to="/receipts/new">
              New Receipt
            </Link>
            <Link className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors" to="/receipts">
              Receipts List
            </Link>
            <Link className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors" to="/lab-tests">
              Lab Tests
            </Link>
            <Link className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors" to="/reports">
              Reports
            </Link>
            <Link className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors" to="/invoices">
              Invoices
            </Link>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-4 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-600">Frontend is running. Please login to access the dashboard.</p>
          <div className="flex gap-4">
            <a className="px-4 py-2 rounded bg-sky-500 text-white hover:bg-sky-600 transition-colors" href="/owner/track">
              Owner Track
            </a>
            <Link className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors" to="/login">
              Internal Login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}