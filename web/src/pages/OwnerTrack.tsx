import { useState } from 'react'
import { z } from 'zod'
import { api } from '../services/api'

const schema = z.object({
  awb: z.string().optional(),
  receipt: z.string().optional(),
  report: z.string().optional(),
  invoice: z.string().optional(),
}).refine((d) => Object.values(d).some(Boolean), { message: 'Enter at least one field' })

// Define the standard timeline steps
const TIMELINE_STEPS = [
  { key: 'received', label: 'Received' },
  { key: 'forwarded', label: 'Forwarded' },
  { key: 'central', label: 'Central' },
  { key: 'lab_queued', label: 'Lab Queued' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'report_ready', label: 'Report Ready' },
  { key: 'communicated', label: 'Communicated' },
  { key: 'invoiced', label: 'Invoiced' },
  { key: 'paid', label: 'Paid' }
]

interface TimelineStep {
  key: string
  label: string
  timestamp?: string
  current?: boolean
  completed?: boolean
}

interface TimelineComponentProps {
  steps: TimelineStep[]
}

function Timeline({ steps }: TimelineComponentProps) {
  // Create a map of API steps for quick lookup
  const apiStepsMap = new Map(steps.map(step => [step.key, step]))
  
  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.current)
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Status Timeline</h2>
      
      {/* Mobile Timeline (Vertical) */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {TIMELINE_STEPS.map((standardStep, index) => {
            const apiStep = apiStepsMap.get(standardStep.key)
            const isCompleted = apiStep?.completed || (currentStepIndex >= 0 && index < currentStepIndex)
            const isCurrent = apiStep?.current || false
            const isFuture = !isCompleted && !isCurrent
            
            return (
              <div key={standardStep.key} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className={`text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {standardStep.label}
                  </div>
                  {apiStep?.timestamp && (
                    <div className="text-xs text-gray-500 mt-1">
                      {apiStep.timestamp}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Desktop Timeline (Horizontal) */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200"></div>
          <div 
            className="absolute top-4 left-0 h-0.5 bg-green-500 transition-all duration-500"
            style={{
              width: currentStepIndex >= 0 
                ? `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`
                : '0%'
            }}
          ></div>
          
          {/* Timeline Steps */}
          <div className="relative flex justify-between">
            {TIMELINE_STEPS.map((standardStep, index) => {
              const apiStep = apiStepsMap.get(standardStep.key)
              const isCompleted = apiStep?.completed || (currentStepIndex >= 0 && index < currentStepIndex)
              const isCurrent = apiStep?.current || false
              const isFuture = !isCompleted && !isCurrent
              
              return (
                <div key={standardStep.key} className="flex flex-col items-center group">
                  {/* Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white shadow-lg scale-110'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110 animate-pulse'
                      : 'bg-white border-gray-300 text-gray-500 group-hover:border-gray-400'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className={`mt-3 text-center transition-colors duration-300 ${
                    isCurrent ? 'text-blue-600 font-semibold' : isCompleted ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    <div className="text-xs whitespace-nowrap">
                      {standardStep.label}
                    </div>
                    {apiStep?.timestamp && (
                      <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                        {apiStep.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Progress Summary */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Progress: {currentStepIndex >= 0 ? currentStepIndex + 1 : 0} of {TIMELINE_STEPS.length} steps completed
            </span>
            <span className={`font-medium ${
              currentStepIndex >= TIMELINE_STEPS.length - 1 
                ? 'text-green-600' 
                : currentStepIndex >= 0 
                ? 'text-blue-600' 
                : 'text-gray-500'
            }`}>
              {currentStepIndex >= TIMELINE_STEPS.length - 1 
                ? 'Complete' 
                : currentStepIndex >= 0 
                ? `Current: ${TIMELINE_STEPS[currentStepIndex]?.label}` 
                : 'Not Started'}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: currentStepIndex >= 0 
                  ? `${((currentStepIndex + 1) / TIMELINE_STEPS.length) * 100}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerTrack() {
  const [form, setForm] = useState({ awb: '' })
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const parsed = schema.safeParse(form)
    if (!parsed.success) { 
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return 
    }
    
    try {
      const params = new URLSearchParams(Object.entries(form).filter(([,v]) => v))
      const res = await api.get(`/owner/track?${params.toString()}`)
      setResult(res.data)
    } catch (err) {
      setError('Failed to fetch tracking information. Please try again.')
      console.error('Tracking error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Package Tracking</h1>
          <p className="mt-2 text-gray-600">Track your package status in real-time</p>
        </div>
        
        <div className="max-w-md mx-auto mb-8">
          <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AWB / Consignment Number
              </label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Enter AWB number (e.g. AWB12345)"
                value={form.awb} 
                onChange={e => setForm({...form, awb: e.target.value})}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Tracking...
                </span>
              ) : (
                'Track Package'
              )}
            </button>
          </form>
        </div>

        {result && <Timeline steps={result.timeline} />}
      </div>
    </div>
  )
}