import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be less than 128 characters'),
  name: z.string().optional(),
})

export const updateGuestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
})

export const createOrderSchema = z.object({
  guestId: z.string().min(1, 'Guest ID is required'),
  photographerId: z.string().min(1, 'Photographer ID is required'),
  photoIds: z
    .array(z.string().min(1, 'Photo ID is required'))
    .min(1, 'At least one photo must be selected'),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
})

export const qrDataSchema = z.object({
  id: z.string().min(1, 'Guest ID is required'),
  name: z.string().min(1, 'Guest name is required').max(100, 'Name too long'),
  type: z.literal('guest'),
  timestamp: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Invalid timestamp'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type QRData = z.infer<typeof qrDataSchema>
