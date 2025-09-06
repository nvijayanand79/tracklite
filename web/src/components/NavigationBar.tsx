import { useNavigate, Link } from 'react-router-dom'

export default function NavigationBar() {
  const navigate = useNavigate()

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-200 mb-6">
      <div>
        <Link to="/" className="text-xl font-bold text-sky-700 hover:text-sky-900">TraceLite</Link>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          onClick={() => navigate(-1)}
        >
          &#8592; Back
        </button>
        <Link
          to="/"
          className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white"
        >
          Home
        </Link>
      </div>
    </nav>
  )
}
