import { z } from 'zod'
import { UserRole } from '../types/user-role.enum'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.Client),
  departmentId: z.string().uuid().optional().nullable(),
})

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().optional().nullable(),
  notificationPrefs: z.record(z.string(), z.any()).optional(),
})

export const ResetUserPasswordSchema = z.object({
  password: z.string().min(8),
})

export type CreateUserBody = z.infer<typeof CreateUserSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>
export type UpdateProfileBody = z.infer<typeof UpdateProfileSchema>
export type ResetUserPasswordBody = z.infer<typeof ResetUserPasswordSchema>
