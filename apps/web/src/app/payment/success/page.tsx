'use client'

import { useLingui } from '@lingui/react'
import { msg } from '@lingui/macro'
import { LoadingScreen } from '@repo/ui/loading-screen'
import { Check, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentSuccessPage() {
  const { _ } = useLingui()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )

  useEffect(() => {
    if (sessionId) {
      // In a real implementation, verify the payment with Stripe
      // For now, just simulate success
      setTimeout(() => setStatus('success'), 2000)
    } else {
      setStatus('error')
    }
  }, [sessionId])

  if (status === 'loading') {
    return <LoadingScreen message={_(msg`Processing payment...`)} />
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              There was an issue processing your payment. Please try again.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/'
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your order has been confirmed and you
            will receive a confirmation email shortly.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
