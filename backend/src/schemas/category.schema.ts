import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
})

export const UpdateCategorySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type CreateCategoryBody = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryBody = z.infer<typeof UpdateCategorySchema>
