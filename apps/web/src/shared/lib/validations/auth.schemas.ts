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
  guestId: z.string().uuid('Invalid guest ID'),
  photographerId: z.string().uuid('Invalid photographer ID'),
  photoIds: z
    .array(z.string().uuid('Invalid photo ID'))
    .min(1, 'At least one photo must be selected'),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
