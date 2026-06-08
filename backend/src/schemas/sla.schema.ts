import { z } from 'zod'
import { Priority } from '../types/priority.enum'

export const CreateSLAConfigSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  priority: z.nativeEnum(Priority),
  departmentId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  firstResponseMinutes: z.number().int().min(1, 'Must be at least 1 minute'),
  resolutionMinutes: z.number().int().min(1, 'Must be at least 1 minute'),
  businessHoursOnly: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

export const UpdateSLAConfigSchema = CreateSLAConfigSchema.partial()

export type CreateSLAConfigBody = z.infer<typeof CreateSLAConfigSchema>
export type UpdateSLAConfigBody = z.infer<typeof UpdateSLAConfigSchema>
