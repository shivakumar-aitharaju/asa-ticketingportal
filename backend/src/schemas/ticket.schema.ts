import { z } from 'zod'
import { Priority } from '../types/priority.enum'
import { TicketStatus } from '../types/ticket-status.enum'

export const CreateTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(500),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  priority: z.nativeEnum(Priority).optional().default(Priority.Medium),
  isEscalated: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
}).refine(d => d.categoryId || d.departmentId, {
  message: 'Either categoryId or departmentId is required',
})

export const UpdateTicketSchema = z.object({
  subject: z.string().min(5).max(500).optional(),
  description: z.string().min(20).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  tags: z.array(z.string()).optional(),
})

export const AssignTicketSchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  reason: z.string().optional(),
})

export const ResolveTicketSchema = z.object({
  resolutionSummary: z.string().min(10, 'Resolution summary must be at least 10 characters'),
})

export const EscalateTicketSchema = z.object({
  reason: z.string().min(10, 'Escalation reason must be at least 10 characters'),
})

export const ReopenTicketSchema = z.object({
  reason: z.string().min(5, 'Reopen reason is required'),
})

export const AddMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  isClientFacing: z.boolean().optional().default(true),
})

export const TicketFilterSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  departmentId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  isEscalated: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const RatingSchema = z.object({
  rating: z.enum(['good', 'bad']),
})

export type CreateTicketBody = z.infer<typeof CreateTicketSchema>
export type UpdateTicketBody = z.infer<typeof UpdateTicketSchema>
export type AssignTicketBody = z.infer<typeof AssignTicketSchema>
export type ResolveTicketBody = z.infer<typeof ResolveTicketSchema>
export type EscalateTicketBody = z.infer<typeof EscalateTicketSchema>
export type ReopenTicketBody = z.infer<typeof ReopenTicketSchema>
export type AddMessageBody = z.infer<typeof AddMessageSchema>
export type TicketFilter = z.infer<typeof TicketFilterSchema>
export type RatingBody = z.infer<typeof RatingSchema>
