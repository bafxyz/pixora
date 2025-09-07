import { Trans } from '@lingui/macro'
import { Trash2, X } from 'lucide-react'
import React from 'react'
import { useCartTotal, useGalleryStore } from '@/shared/stores/gallery.store'
import { ImageWithFallback } from './image-with-fallback'

export function Cart() {
  const {
    cart,
    showCart,
    setShowCart,
    removeFromCart,
    updateQuantity,
    setShowCheckout,
  } = useGalleryStore()

  const total = useCartTotal()

  if (!showCart) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
              <Trans>Your Cart</Trans>
            </h2>
            <button
              type="button"
              onClick={() => setShowCart(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="flex items-center space-x-4 border-b pb-4"
                  >
                    <div className="w-16 h-16 flex-shrink-0">
                      <ImageWithFallback
                        src={item.fileName}
                        alt="Cart item"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Photo {item.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {item.type}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ${item.type === 'digital' ? item.price : item.price * 2}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.type, item.quantity - 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.type, item.quantity + 1)
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-gray-900">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCart(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Continue Shopping
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCart(false)
                      setShowCheckout(true)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
