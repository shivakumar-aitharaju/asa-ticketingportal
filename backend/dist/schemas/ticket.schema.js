"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingSchema = exports.TicketFilterSchema = exports.AddMessageSchema = exports.ReopenTicketSchema = exports.EscalateTicketSchema = exports.ResolveTicketSchema = exports.AssignTicketSchema = exports.UpdateTicketSchema = exports.CreateTicketSchema = void 0;
const zod_1 = require("zod");
const priority_enum_1 = require("../types/priority.enum");
const ticket_status_enum_1 = require("../types/ticket-status.enum");
exports.CreateTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5, 'Subject must be at least 5 characters').max(500),
    description: zod_1.z.string().min(20, 'Description must be at least 20 characters'),
    categoryId: zod_1.z.string().uuid('Invalid category ID').optional(),
    departmentId: zod_1.z.string().uuid('Invalid department ID').optional(),
    priority: zod_1.z.nativeEnum(priority_enum_1.Priority).optional().default(priority_enum_1.Priority.Medium),
    isEscalated: zod_1.z.boolean().optional().default(false),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
}).refine(d => d.categoryId || d.departmentId, {
    message: 'Either categoryId or departmentId is required',
});
exports.UpdateTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5).max(500).optional(),
    description: zod_1.z.string().min(20).optional(),
    priority: zod_1.z.nativeEnum(priority_enum_1.Priority).optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(ticket_status_enum_1.TicketStatus).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AssignTicketSchema = zod_1.z.object({
    agentId: zod_1.z.string().uuid('Invalid agent ID'),
    reason: zod_1.z.string().optional(),
});
exports.ResolveTicketSchema = zod_1.z.object({
    resolutionSummary: zod_1.z.string().min(10, 'Resolution summary must be at least 10 characters'),
});
exports.EscalateTicketSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10, 'Escalation reason must be at least 10 characters'),
});
exports.ReopenTicketSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, 'Reopen reason is required'),
});
exports.AddMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message cannot be empty'),
    isClientFacing: zod_1.z.boolean().optional().default(true),
});
exports.TicketFilterSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(ticket_status_enum_1.TicketStatus).optional(),
    priority: zod_1.z.nativeEnum(priority_enum_1.Priority).optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    isEscalated: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.RatingSchema = zod_1.z.object({
    rating: zod_1.z.enum(['good', 'bad']),
});
//# sourceMappingURL=ticket.schema.js.map