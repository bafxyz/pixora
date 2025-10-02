import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be less than 128 characters'),
  name: z.string().optional(),
  role: z.enum(['studio-admin', 'photographer']).default('photographer'),
  studioName: z.string().optional(),
})

export const qrDataSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['session', 'guest']),
  timestamp: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Invalid timestamp'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type QRData = z.infer<typeof qrDataSchema>
