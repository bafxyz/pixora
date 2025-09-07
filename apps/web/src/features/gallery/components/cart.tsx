import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { Button } from '@repo/ui/button'
import { Trash2, X } from 'lucide-react'
import React from 'react'

import { useCartTotal, useGalleryStore } from '@/shared/stores/gallery.store'
import { ImageWithFallback } from './image-with-fallback'

export function Cart() {
  const { _ } = useLingui()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">
              <Trans>Your Cart</Trans>
            </h2>
            <Button
              type="button"
              onClick={() => setShowCart(false)}
              variant="ghost"
              size="icon"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg">
                <Trans>Your cart is empty</Trans>
              </p>
              <Button
                type="button"
                onClick={() => setShowCart(false)}
                className="mt-4"
              >
                <Trans>Continue Shopping</Trans>
              </Button>
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
                        src={item.file_path}
                        alt="Cart item"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {_(`Photo ${item.id.slice(-8)}`)}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {item.type}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        ${item.type === 'digital' ? item.price : item.price * 2}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.type, item.quantity - 1)
                        }
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.type, item.quantity + 1)
                        }
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeFromCart(item.id, item.type)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-foreground">
                    <Trans>Total:</Trans>
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => setShowCart(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Trans>Continue Shopping</Trans>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCart(false)
                      setShowCheckout(true)
                    }}
                    className="flex-1"
                  >
                    <Trans>Checkout</Trans>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
