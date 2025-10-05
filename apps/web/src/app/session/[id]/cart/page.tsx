'use client'

import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  CreditCard,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

type ProductType = 'print' | 'magnet' | 'digital'

interface CartItem {
  id: string
  filePath: string
  fileName: string
  productType: ProductType
  quantity: number
  price: number
}

interface PhotoSession {
  id: string
  name: string
  photographerName: string
  pricing: {
    digital: number
    print: number
    magnet: number
    currency: string
    enableDigital?: boolean
    enablePrint?: boolean
    enableMagnet?: boolean
  }
  studio?: {
    name: string | null
    logoUrl: string | null
    brandColor: string | null
    welcomeMessage: string | null
  }
}

export default function CartPage() {
  const { _ } = useLingui()
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<PhotoSession | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash' | 'tinkoff' | null
  >(null)

  // Guest information
  const [guestInfo, setGuestInfo] = useState({
    email: '',
    name: '',
    phone: '',
  })

  // Pricing per product type - dynamically loaded from session
  const priceMap: Record<ProductType, number> = useMemo(
    () =>
      session?.pricing
        ? {
            digital: session.pricing.digital,
            print: session.pricing.print,
            magnet: session.pricing.magnet,
          }
        : {
            digital: 500,
            print: 750,
            magnet: 750,
          },
    [session?.pricing]
  )

  const productTypeLabels: Record<ProductType, string> = {
    print: _(msg`Print Photo`),
    magnet: _(msg`Photo Magnet`),
    digital: _(msg`Digital Copy`),
  }

  // Calculate total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const finalAmount = totalAmount

  useEffect(() => {
    if (!sessionId) return

    const fetchSessionAndCart = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/session/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setSession(data.session)

          // Get pricing from session data
          const pricing = data.session.pricing || {
            digital: 500,
            print: 750,
            magnet: 750,
          }

          const savedCart = localStorage.getItem(`cart_${sessionId}`)
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart)
              let cartData: Array<{ photoId: string; productType: string }>

              // Handle legacy format (array of strings)
              if (
                Array.isArray(parsed) &&
                parsed.length > 0 &&
                typeof parsed[0] === 'string'
              ) {
                cartData = parsed.map((id) => ({
                  photoId: id,
                  productType: 'digital',
                }))
              } else if (Array.isArray(parsed)) {
                cartData = parsed
              } else {
                cartData = []
              }

              // Handle digital package items - deduplicate
              const hasDigitalPackage = cartData.some(
                (item) => item.productType === 'digital'
              )

              const cartItems: CartItem[] = cartData
                .map((item) => {
                  // Handle digital package separately (deduplicate)
                  if (
                    item.productType === 'digital' &&
                    item.photoId === 'digital-package'
                  ) {
                    return {
                      id: 'digital-package',
                      filePath: '',
                      fileName: 'Digital Photos Package',
                      productType: 'digital' as ProductType,
                      quantity: 1,
                      price: pricing.digital,
                    }
                  }

                  // Skip legacy digital items
                  if (item.productType === 'digital') {
                    return null
                  }

                  // Handle regular photos
                  const photo = data.session.photos.find(
                    (p: { id: string }) => p.id === item.photoId
                  )
                  if (!photo) return null

                  const productType = item.productType as ProductType
                  return {
                    id: photo.id,
                    filePath: photo.filePath,
                    fileName: photo.fileName,
                    productType,
                    quantity: 1,
                    price: pricing[productType] || pricing.digital,
                  }
                })
                .filter(Boolean) as CartItem[]

              // Add digital package if we have legacy digital items
              if (
                hasDigitalPackage &&
                !cartItems.some((item) => item.id === 'digital-package')
              ) {
                cartItems.unshift({
                  id: 'digital-package',
                  filePath: '',
                  fileName: 'Digital Photos Package',
                  productType: 'digital' as ProductType,
                  quantity: 1,
                  price: pricing.digital,
                })
              }

              setCart(cartItems)
            } catch {
              setCart([])
            }
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

  const updateProductType = (photoId: string, newType: ProductType) => {
    setCart((prev) => {
      const newCart = prev.map((item) =>
        item.id === photoId
          ? { ...item, productType: newType, price: priceMap[newType] }
          : item
      )
      const cartData = newCart.map((item) => ({
        photoId: item.id,
        productType: item.productType,
      }))
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cartData))
      return newCart
    })
  }

  const updateQuantity = (photoId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(photoId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === photoId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeFromCart = (photoId: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== photoId)
      const cartData = newCart.map((item) => ({
        photoId: item.id,
        productType: item.productType,
      }))
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cartData))
      return newCart
    })
  }

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error(_(msg`Your cart is empty`))
      return
    }
    setShowCheckout(true)
  }

  const handlePlaceOrder = async () => {
    if (!guestInfo.email.trim()) {
      toast.error(_(msg`Email is required`))
      return
    }

    if (!selectedPaymentMethod) {
      toast.error(_(msg`Please select a payment method`))
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guestEmail: guestInfo.email,
          guestName: guestInfo.name || null,
          guestPhone: guestInfo.phone || null,
          items: cart.map((item) => ({
            photoId: item.id,
            productType: item.productType,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: selectedPaymentMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Clear cart
        localStorage.removeItem(`cart_${sessionId}`)

        if (selectedPaymentMethod === 'tinkoff' && data.order.paymentLink) {
          // Redirect to Tinkoff payment page
          window.location.href = data.order.paymentLink
        } else {
          // Cash payment - show success message
          toast.success(_(msg`Order placed successfully!`))
          toast.success(
            _(
              msg`Your order has been sent to the photographer. They will contact you soon.`
            )
          )
          router.push(`/session/${sessionId}`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || _(msg`Failed to place order`))
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(_(msg`Error placing order`))
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header
        className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30 shadow-sm"
        style={
          session?.studio?.brandColor
            ? { borderBottomColor: `${session.studio.brandColor}30` }
            : undefined
        }
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {session?.studio?.logoUrl ? (
              <div className="relative h-12 w-32">
                <Image
                  src={session.studio.logoUrl}
                  alt={session.studio.name || 'Studio Logo'}
                  fill
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <Link
                href="/"
                className="text-2xl font-bold"
                style={
                  session?.studio?.brandColor
                    ? { color: session.studio.brandColor }
                    : undefined
                }
              >
                {session?.studio?.name || 'Pixora'}
              </Link>
            )}

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                onClick={() => router.push(`/session/${sessionId}`)}
                variant="outline"
                style={
                  session?.studio?.brandColor
                    ? {
                        borderColor: session.studio.brandColor,
                        color: session.studio.brandColor,
                      }
                    : undefined
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <Trans>Back to Gallery</Trans>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={
              session?.studio?.brandColor
                ? { color: session.studio.brandColor }
                : undefined
            }
          >
            {showCheckout ? <Trans>Checkout</Trans> : <Trans>Your Cart</Trans>}
          </h1>
          {session && (
            <p className="text-slate-600">
              {session.name} - {session.photographerName}
            </p>
          )}
        </div>

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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Trans>Browse Photos</Trans>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : showCheckout ? (
          <div className="max-w-2xl mx-auto">
            <div className="grid gap-6">
              {/* Guest Information */}
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    <Trans>Your Information</Trans>
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">
                        <Trans>Email</Trans> *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, email: e.target.value })
                        }
                        placeholder={_(msg`your@email.com`)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">
                        <Trans>Name</Trans>
                      </Label>
                      <Input
                        id="name"
                        value={guestInfo.name}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, name: e.target.value })
                        }
                        placeholder={_(msg`Your name`)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        <Trans>Phone</Trans>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, phone: e.target.value })
                        }
                        placeholder={_(msg`+1234567890`)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    <Trans>Payment Method</Trans>
                  </h2>
                  <div className="grid gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('tinkoff')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedPaymentMethod === 'tinkoff'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <div className="flex-1 text-left">
                          <p className="font-semibold">
                            <Trans>Online Payment (Tinkoff)</Trans>
                          </p>
                          <p className="text-sm text-slate-600">
                            <Trans>
                              Pay securely with card or other methods
                            </Trans>
                          </p>
                        </div>
                        {selectedPaymentMethod === 'tinkoff' && (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('cash')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedPaymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-green-600" />
                        <div className="flex-1 text-left">
                          <p className="font-semibold">
                            <Trans>Cash Payment</Trans>
                          </p>
                          <p className="text-sm text-slate-600">
                            <Trans>Pay in person at the studio</Trans>
                          </p>
                        </div>
                        {selectedPaymentMethod === 'cash' && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    <Trans>Order Summary</Trans>
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>
                        <Trans>Items</Trans> ({cart.length})
                      </span>
                      <span>₽{totalAmount.toFixed(0)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>
                        <Trans>Total</Trans>
                      </span>
                      <span>₽{finalAmount.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setShowCheckout(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trans>Back</Trans>
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !selectedPaymentMethod}
                      className="flex-1 text-white"
                      style={
                        session?.studio?.brandColor
                          ? { backgroundColor: session.studio.brandColor }
                          : undefined
                      }
                    >
                      {isProcessing ? (
                        <Trans>Processing...</Trans>
                      ) : (
                        <Trans>Place Order</Trans>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4 mb-6">
              {cart.map((item) => (
                <Card
                  key={`${item.id}-${item.productType}`}
                  className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {item.id === 'digital-package' ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <ShoppingCart className="w-12 h-12 text-blue-600" />
                        </div>
                      ) : (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.filePath}
                            alt={item.fileName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-4">
                        <h3 className="font-medium text-slate-800">
                          {item.id === 'digital-package'
                            ? _(msg`All Photos - Digital Package`)
                            : item.fileName}
                        </h3>

                        {/* Hide product type selector for digital package */}
                        {item.id !== 'digital-package' && (
                          <div className="space-y-2">
                            <Label className="text-sm text-slate-600">
                              <Trans>Product Type</Trans>
                            </Label>
                            <Select
                              value={item.productType}
                              onValueChange={(value: string) =>
                                updateProductType(item.id, value as ProductType)
                              }
                            >
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue>
                                  {productTypeLabels[item.productType]}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {session?.pricing.enablePrint !== false && (
                                  <SelectItem value="print">
                                    <Trans>Print Photo</Trans> -{' '}
                                    {session?.pricing.currency === 'USD'
                                      ? '$'
                                      : session?.pricing.currency === 'EUR'
                                        ? '€'
                                        : '₽'}
                                    {priceMap.print}
                                  </SelectItem>
                                )}
                                {session?.pricing.enableMagnet !== false && (
                                  <SelectItem value="magnet">
                                    <Trans>Photo Magnet</Trans> -{' '}
                                    {session?.pricing.currency === 'USD'
                                      ? '$'
                                      : session?.pricing.currency === 'EUR'
                                        ? '€'
                                        : '₽'}
                                    {priceMap.magnet}
                                  </SelectItem>
                                )}
                                {session?.pricing.enableDigital !== false && (
                                  <SelectItem value="digital">
                                    <Trans>Digital Copy</Trans> -{' '}
                                    {session?.pricing.currency === 'USD'
                                      ? '$'
                                      : session?.pricing.currency === 'EUR'
                                        ? '€'
                                        : '₽'}
                                    {priceMap.digital}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Show quantity controls only for print/magnet, not for digital */}
                          {item.productType !== 'digital' ? (
                            <div className="flex items-center gap-3">
                              <Label className="text-sm text-slate-600">
                                <Trans>Quantity</Trans>:
                              </Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="w-8 h-8 rounded-full p-0"
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="w-8 h-8 rounded-full p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">
                              <Trans>Digital package</Trans>
                            </div>
                          )}
                          <span className="text-lg font-semibold text-slate-800">
                            ₽
                            {item.productType === 'digital'
                              ? item.price.toFixed(0)
                              : (item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
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

            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">
                      <Trans>Subtotal</Trans> ({cart.length}{' '}
                      {cart.length === 1 ? (
                        <Trans>item</Trans>
                      ) : (
                        <Trans>items</Trans>
                      )}
                      )
                    </span>
                    <span className="text-lg font-semibold">
                      ₽{totalAmount.toFixed(0)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-xl font-bold">
                      <Trans>Total</Trans>
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₽{finalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full text-white"
                  size="lg"
                  style={
                    session?.studio?.brandColor
                      ? { backgroundColor: session.studio.brandColor }
                      : undefined
                  }
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
