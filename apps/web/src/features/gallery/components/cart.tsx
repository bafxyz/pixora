import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
import { Button } from '@repo/ui/button'
import { ShoppingCart, Trash2, X } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              <Trans>Your Cart</Trans>
            </h2>
            <Button
              type="button"
              onClick={() => setShowCart(false)}
              variant="ghost"
              size="icon"
              className="hover:bg-muted/50 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                <Trans>Your cart is empty</Trans>
              </p>
              <p className="text-sm text-gray-600 mb-6">
                <Trans>Add some photos to get started</Trans>
              </p>
              <Button
                type="button"
                onClick={() => setShowCart(false)}
                variant="outline"
                className="px-8"
              >
                <Trans>Continue Shopping</Trans>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <ImageWithFallback
                        src={item.file_path}
                        alt="Cart item"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {_(`Photo ${item.id.slice(-8)}`)}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize mb-1">
                        {item.type}
                      </p>
                      <p className="text-sm font-medium text-foreground mb-2">
                        ${item.type === 'digital' ? item.price : item.price * 2}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.type,
                              item.quantity - 1
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 rounded-full"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.type,
                              item.quantity + 1
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="w-10 h-10 rounded-full"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold text-foreground">
                        $
                        {(item.type === 'digital'
                          ? item.price
                          : item.price * 2) * item.quantity}
                      </p>
                      <Button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.type)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-6 bg-muted/30">
                <div className="flex justify-between items-center mb-4 text-lg">
                  <span className="font-medium text-foreground">
                    <Trans>Total:</Trans>
                  </span>
                  <span className="font-bold text-2xl text-foreground">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setShowCart(false)}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    <Trans>Continue Shopping</Trans>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCart(false)
                      setShowCheckout(true)
                    }}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
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
