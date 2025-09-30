'use client'

import { Trans } from '@lingui/react/macro'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

interface CartItem {
  id: string
  filePath: string
  fileName: string
}

interface PhotoSession {
  id: string
  name: string
  photographerName: string
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const fetchSessionAndCart = async () => {
      try {
        setLoading(true)

        // Fetch session data
        const response = await fetch(`/api/session/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setSession(data.session)

          // Load cart from localStorage
          const savedCart = localStorage.getItem(`cart_${sessionId}`)
          if (savedCart) {
            const cartPhotoIds = JSON.parse(savedCart) as string[]

            // Get full photo details from session photos
            const cartItems = data.session.photos.filter((photo: CartItem) =>
              cartPhotoIds.includes(photo.id)
            )
            setCart(cartItems)
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionAndCart()
  }, [sessionId])

  const removeFromCart = (photoId: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== photoId)

      // Update localStorage
      const cartIds = newCart.map((item) => item.id)
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cartIds))

      return newCart
    })
  }

  const handleCheckout = () => {
    // TODO: Implement checkout functionality
    alert('Checkout functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              Pixora
            </Link>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Back Button */}
              <Button
                onClick={() => router.push(`/session/${sessionId}`)}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <Trans>Back to Gallery</Trans>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            <Trans>Your Cart</Trans>
          </h1>
          {session && (
            <p className="text-slate-600 dark:text-slate-300">
              {session.name} - {session.photographerName}
            </p>
          )}
        </div>

        {/* Cart Content */}
        {cart.length === 0 ? (
          <div className="max-w-md mx-auto">
            <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  <Trans>Your cart is empty</Trans>
                </h2>
                <p className="text-slate-600 mb-6">
                  <Trans>Add some photos to your cart to continue</Trans>
                </p>
                <Button
                  onClick={() => router.push(`/session/${sessionId}`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Trans>Browse Photos</Trans>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Cart Items */}
            <div className="grid gap-4 mb-6">
              {cart.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.filePath}
                          alt={item.fileName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">
                          {item.fileName}
                        </h3>
                      </div>
                      <Button
                        onClick={() => removeFromCart(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-slate-800">
                    <Trans>Total</Trans>
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {cart.length} <Trans>photos</Trans>
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  <Trans>Proceed to Checkout</Trans>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}