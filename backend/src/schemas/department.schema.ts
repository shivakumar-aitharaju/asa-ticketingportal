import { z } from 'zod'

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
})

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const MapCategorySchema = z.object({
  categoryId: z.string().uuid(),
})

export type CreateDepartmentBody = z.infer<typeof CreateDepartmentSchema>
export type UpdateDepartmentBody = z.infer<typeof UpdateDepartmentSchema>
export type MapCategoryBody = z.infer<typeof MapCategorySchema>
