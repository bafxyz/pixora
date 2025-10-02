import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { FormField } from '@repo/ui/form-field'
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@repo/ui/modal'
import { Spinner } from '@repo/ui/spinner'
import { Check } from 'lucide-react'
import React, { useState } from 'react'
import { useCartTotal, useGalleryStore } from '@/shared/stores/gallery.store'

export function Checkout() {
  const { _ } = useLingui()
  const {
    showCheckout,
    setShowCheckout,
    cart,
    orderForm,
    updateOrderForm,
    submitOrder,
    isOrdering,
    setIsOrdering,
    orderComplete,
    setShowCart,
    resetOrderForm,
  } = useGalleryStore()

  const total = useCartTotal()
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!showCheckout) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!orderForm.name.trim()) newErrors.name = _(t`Name is required`)
    if (!orderForm.email.trim()) newErrors.email = _(t`Email is required`)
    else if (!/\S+@\S+\.\S+/.test(orderForm.email))
      newErrors.email = _(t`Email is invalid`)
    if (!orderForm.phone.trim()) newErrors.phone = _(t`Phone is required`)
    if (!orderForm.address.trim()) newErrors.address = _(t`Address is required`)

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsOrdering(true)

    try {
      // First create the order
      await submitOrder()

      // Then create payment session
      const paymentResponse = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: 'temp-order-id', // In real implementation, get from submitOrder response
          amount: total,
          currency: 'usd',
        }),
      })

      if (paymentResponse.ok) {
        const { url } = await paymentResponse.json()
        // Redirect to payment page
        window.location.href = url
      } else {
        throw new Error(_(t`Payment session creation failed`))
      }
    } catch (error) {
      console.error('Order submission failed:', error)
      // You might want to show an error message to the user
    } finally {
      setIsOrdering(false)
    }
  }

  const handleClose = () => {
    setShowCheckout(false)
    if (!orderComplete) {
      setShowCart(true)
    } else {
      resetOrderForm()
    }
  }

  if (orderComplete) {
    return (
      <Modal isOpen={true} onClose={handleClose} size="md">
        <ModalContent>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              <Trans>Order Complete!</Trans>
            </h2>
            <p className="text-gray-600 mb-6">
              <Trans>
                Thank you for your order. We'll process it shortly and send you
                a confirmation email.
              </Trans>
            </p>
            <ModalFooter>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Trans>Close</Trans>
              </button>
            </ModalFooter>
          </div>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            <Trans>Checkout</Trans>
          </h2>
        </div>
      </ModalHeader>
      <ModalContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Trans>Order Summary</Trans>
            </h3>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.type}`}
                  className="flex justify-between"
                >
                  <span className="text-sm text-gray-600">
                    {_(
                      t`Photo ${item.id.slice(-8)} (${item.type}) x${item.quantity}`
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    $
                    {(item.type === 'digital' ? item.price : item.price * 2) *
                      item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>
                  <Trans>Total:</Trans>
                </span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Trans>Contact Information</Trans>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label={_(t`Full Name`)} error={errors.name} required>
                <input
                  type="text"
                  value={orderForm.name}
                  onChange={(e) => updateOrderForm({ name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <FormField label={_(t`Email`)} error={errors.email} required>
                <input
                  type="email"
                  value={orderForm.email}
                  onChange={(e) => updateOrderForm({ email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <FormField label={_(t`Phone`)} error={errors.phone} required>
                <input
                  type="tel"
                  value={orderForm.phone}
                  onChange={(e) => updateOrderForm({ phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <FormField label={_(t`Address`)} error={errors.address} required>
                <textarea
                  rows={3}
                  value={orderForm.address}
                  onChange={(e) => updateOrderForm({ address: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </FormField>

              <button
                type="submit"
                disabled={isOrdering}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOrdering && <Spinner size="sm" />}
                {isOrdering ? _(t`Processing...`) : _(t`Place Order`)}
              </button>
            </form>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
