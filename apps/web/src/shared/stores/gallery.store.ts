import { create } from 'zustand'

export interface Photo {
  id: string
  photographer_id: string
  session_id: string
  client_id: string
  file_path: string
  file_name: string
  file_size: number | null
  is_selected: boolean
  created_at: string
  updated_at: string
}

export type ProductType = 'print' | 'magnet' | 'digital'

export interface CartItem {
  id: string
  photographer_id: string
  session_id: string
  client_id: string
  file_path: string
  file_name: string
  file_size: number | null
  is_selected: boolean
  created_at: string
  updated_at: string
  quantity: number
  productType: ProductType
  price: number // Price for cart calculations
}

export interface PhotographerProfile {
  id: string
  studioName: string
  firstName: string
  lastName: string
  settings: {
    brandColor: string
    logoUrl: string
    welcomeMessage: string
  }
}

export interface OrderForm {
  name: string
  email: string
  phone: string
  address: string
}

interface GalleryState {
  // Photos
  photos: Photo[]
  isLoadingPhotos: boolean
  selectedPhoto: Photo | null

  // Photographer
  photographer: PhotographerProfile | null
  isLoadingPhotographer: boolean

  // Cart
  cart: CartItem[]
  showCart: boolean

  // Checkout
  showCheckout: boolean
  isOrdering: boolean
  orderComplete: boolean
  orderForm: OrderForm

  // Demo images
  demoImages: string[]
}

interface GalleryActions {
  // Photos
  setPhotos: (photos: Photo[]) => void
  setIsLoadingPhotos: (loading: boolean) => void
  setSelectedPhoto: (photo: Photo | null) => void

  // Photographer
  setPhotographer: (photographer: PhotographerProfile | null) => void
  setIsLoadingPhotographer: (loading: boolean) => void

  // Cart
  addToCart: (photo: Photo, productType: ProductType) => void
  removeFromCart: (photoId: string, productType: ProductType) => void
  updateQuantity: (
    photoId: string,
    productType: ProductType,
    quantity: number
  ) => void
  updateProductType: (
    photoId: string,
    oldType: ProductType,
    newType: ProductType
  ) => void
  clearCart: () => void
  setShowCart: (show: boolean) => void

  // Checkout
  setShowCheckout: (show: boolean) => void
  setIsOrdering: (ordering: boolean) => void
  setOrderComplete: (complete: boolean) => void
  updateOrderForm: (form: Partial<OrderForm>) => void
  resetOrderForm: () => void

  // Demo images
  setDemoImages: (images: string[]) => void

  // Async actions
  loadPhotos: (sessionId: string) => Promise<void>
  loadPhotographer: (photographerId: string) => Promise<void>
  submitOrder: () => Promise<void>
}

type GalleryStore = GalleryState & GalleryActions

export const useGalleryStore = create<GalleryStore>((set, get) => ({
  // Initial state
  photos: [],
  isLoadingPhotos: true,
  selectedPhoto: null,

  photographer: null,
  isLoadingPhotographer: false,

  cart: [],
  showCart: false,

  showCheckout: false,
  isOrdering: false,
  orderComplete: false,
  orderForm: {
    name: '',
    email: '',
    phone: '',
    address: '',
  },

  demoImages: [],

  // Actions
  setPhotos: (photos) => set({ photos }),
  setIsLoadingPhotos: (isLoadingPhotos) => set({ isLoadingPhotos }),
  setSelectedPhoto: (selectedPhoto) => set({ selectedPhoto }),

  setPhotographer: (photographer) => set({ photographer }),
  setIsLoadingPhotographer: (isLoadingPhotographer) =>
    set({ isLoadingPhotographer }),

  addToCart: (photo, productType) => {
    const { cart } = get()
    const existingItem = cart.find(
      (item) => item.id === photo.id && item.productType === productType
    )

    if (existingItem) {
      set({
        cart: cart.map((item) =>
          item.id === photo.id && item.productType === productType
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      })
    } else {
      // Default prices per product type (in RUB)
      const priceMap: Record<ProductType, number> = {
        digital: 500,
        print: 1000,
        magnet: 750,
      }

      set({
        cart: [
          ...cart,
          {
            ...photo,
            quantity: 1,
            productType,
            price: priceMap[productType],
          },
        ],
      })
    }
  },

  removeFromCart: (photoId, productType) => {
    const { cart } = get()
    set({
      cart: cart.filter(
        (item) => !(item.id === photoId && item.productType === productType)
      ),
    })
  },

  updateQuantity: (photoId, productType, quantity) => {
    const { cart } = get()
    if (quantity <= 0) {
      get().removeFromCart(photoId, productType)
    } else {
      set({
        cart: cart.map((item) =>
          item.id === photoId && item.productType === productType
            ? { ...item, quantity }
            : item
        ),
      })
    }
  },

  updateProductType: (photoId, oldType, newType) => {
    const { cart } = get()
    const priceMap: Record<ProductType, number> = {
      digital: 500,
      print: 1000,
      magnet: 750,
    }

    set({
      cart: cart.map((item) =>
        item.id === photoId && item.productType === oldType
          ? { ...item, productType: newType, price: priceMap[newType] }
          : item
      ),
    })
  },

  clearCart: () => set({ cart: [] }),
  setShowCart: (showCart) => set({ showCart }),

  setShowCheckout: (showCheckout) => set({ showCheckout }),
  setIsOrdering: (isOrdering) => set({ isOrdering }),
  setOrderComplete: (orderComplete) => set({ orderComplete }),

  updateOrderForm: (updates) => {
    const { orderForm } = get()
    set({ orderForm: { ...orderForm, ...updates } })
  },

  resetOrderForm: () =>
    set({
      orderForm: {
        name: '',
        email: '',
        phone: '',
        address: '',
      },
    }),

  setDemoImages: (demoImages) => set({ demoImages }),

  // Async actions
  loadPhotos: async (sessionId) => {
    set({ isLoadingPhotos: true })
    try {
      const response = await fetch(`/api/session/${sessionId}`)

      if (response.ok) {
        const result = await response.json()

        // Transform photos from camelCase to snake_case
        const transformedPhotos = (result.session?.photos || []).map(
          (photo: {
            id: string
            filePath: string
            fileName: string
            createdAt: string
          }) => ({
            id: photo.id,
            photographer_id: '',
            session_id: result.session.id,
            client_id: '',
            file_path: photo.filePath,
            file_name: photo.fileName,
            file_size: 0,
            is_selected: true,
            created_at: photo.createdAt,
            updated_at: photo.createdAt,
          })
        )

        set({
          photos: transformedPhotos,
          photographer: {
            id: 'default',
            studioName: result.session?.photographerName || 'Studio',
            firstName: '',
            lastName: '',
            settings: {
              brandColor: '#000000',
              logoUrl: '',
              welcomeMessage: '',
            },
          },
        })
      } else {
        // Handle error by setting empty state
        console.error(
          'Failed to load photos:',
          response.status,
          response.statusText
        )
        set({
          photos: [],
          photographer: null,
        })
      }
    } catch (error) {
      console.error('Photos loading error:', error)
      // Set empty state on error
      set({
        photos: [],
        photographer: null,
      })
    } finally {
      set({ isLoadingPhotos: false })
    }
  },

  loadPhotographer: async (_photographerId) => {
    set({ isLoadingPhotographer: true })
    try {
      // For now, photographer info is loaded with photos in loadPhotos
      // This function can be used if we need to load photographer info separately
      console.log('Photographer info loaded via loadPhotos')
    } catch (error) {
      console.error('Photographer loading error:', error)
    } finally {
      set({ isLoadingPhotographer: false })
    }
  },

  submitOrder: async () => {
    const { cart, orderForm } = get()
    set({ isOrdering: true })

    try {
      const orderItems = cart.map((item) => ({
        photoId: item.id,
        productType: item.productType,
        quantity: item.quantity,
        price: item.price,
        photographerId: item.photographer_id,
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactInfo: orderForm,
          items: orderItems,
        }),
      })

      if (response.ok) {
        const orderData = await response.json()

        // Send order confirmation email
        try {
          const { photographer } = get()
          const total = get().cart.reduce((sum, item) => {
            return sum + item.price * item.quantity
          }, 0)

          const emailData = {
            orderId: orderData.orderId || `ORDER-${Date.now()}`,
            guestName: orderForm.name,
            guestEmail: orderForm.email,
            photographerName: photographer
              ? photographer.studioName
              : 'Photographer',
            studioName: photographer?.studioName || 'Photo Studio',
            items: get().cart.map((item) => ({
              name: `${item.file_name} (${item.productType})`,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: total,
            orderDate: new Date().toISOString(),
          }

          // Send email asynchronously (don't block order completion)
          fetch('/api/emails/order-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
          }).catch((error) => {
            console.error('Failed to send order confirmation email:', error)
          })
        } catch (emailError) {
          console.error('Error preparing order confirmation email:', emailError)
          // Don't fail the order if email fails
        }

        set({ orderComplete: true, cart: [], showCheckout: false })
      } else {
        throw new Error('Order submission failed')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      throw error
    } finally {
      set({ isOrdering: false })
    }
  },
}))

// Selectors for commonly used computed values
export const useCartTotal = () =>
  useGalleryStore((state) =>
    state.cart.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  )

export const useCartItemCount = () =>
  useGalleryStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  )
