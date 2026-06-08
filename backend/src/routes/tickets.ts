import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { TicketController } from '../controllers/ticket.controller'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import {
  CreateTicketSchema, AssignTicketSchema, ResolveTicketSchema,
  EscalateTicketSchema, ReopenTicketSchema, AddMessageSchema, TicketFilterSchema,
  RatingSchema
} from '../schemas/ticket.schema'
import { UserRole } from '../types/user-role.enum'

const tickets: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new TicketController(f)
    const auth = [f.authenticate]
    const staffOnly = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager, UserRole.TeamLeader, UserRole.Agent])]
    const tlAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager, UserRole.TeamLeader])]

    f.get('/', { schema: { tags: ['tickets'], security: [{ bearerAuth: [] }] }, preHandler: auth }, ctrl.findAll.bind(ctrl))

    f.post('/', {
      schema: { tags: ['tickets'], security: [{ bearerAuth: [] }], body: zodToFastifySchema(CreateTicketSchema) },
      preHandler: auth,
      preValidation: async (req, rep) => {
        const r = CreateTicketSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.create.bind(ctrl))

    f.get('/:id', { schema: { tags: ['tickets'], security: [{ bearerAuth: [] }] }, preHandler: auth }, ctrl.findById.bind(ctrl))

    f.get('/:id/messages', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getMessages.bind(ctrl))

    f.post('/:id/messages', {
      schema: { tags: ['tickets'], body: zodToFastifySchema(AddMessageSchema) },
      preHandler: auth,
      preValidation: async (req, rep) => {
        const r = AddMessageSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.addMessage.bind(ctrl))

    f.post('/:id/assign', {
      schema: { tags: ['tickets'], body: zodToFastifySchema(AssignTicketSchema) },
      preHandler: tlAbove,
      preValidation: async (req, rep) => {
        const r = AssignTicketSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.assign.bind(ctrl))

    f.post('/:id/resolve', {
      schema: { tags: ['tickets'], body: zodToFastifySchema(ResolveTicketSchema) },
      preHandler: staffOnly,
      preValidation: async (req, rep) => {
        const r = ResolveTicketSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.resolve.bind(ctrl))

    f.post('/:id/close', { schema: { tags: ['tickets'] }, preHandler: staffOnly }, ctrl.close.bind(ctrl))

    f.post('/:id/reopen', {
      schema: { tags: ['tickets'], body: zodToFastifySchema(ReopenTicketSchema) },
      preHandler: auth,
      preValidation: async (req, rep) => {
        const r = ReopenTicketSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.reopen.bind(ctrl))

    f.post('/:id/escalate', {
      schema: { tags: ['tickets'], body: zodToFastifySchema(EscalateTicketSchema) },
      preHandler: tlAbove,
      preValidation: async (req, rep) => {
        const r = EscalateTicketSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.escalate.bind(ctrl))

    f.get('/:id/history', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getHistory.bind(ctrl))
    f.get('/:id/sla', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getSLA.bind(ctrl))

    // Client self-resolve
    f.post('/:id/client-resolve', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.clientResolve.bind(ctrl))

    // Rating (client only, after resolution)
    f.post('/:id/rate', {
      schema: { tags: ['tickets'] },
      preHandler: auth,
      preValidation: async (req, rep) => {
        const r = RatingSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400 } })
        ;(req as any).body = r.data
      }
    }, ctrl.rateTicket.bind(ctrl))

    // Attachments
    f.get('/:id/attachments', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.listAttachments.bind(ctrl))
    f.post('/:id/attachments', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.uploadAttachment.bind(ctrl))
    f.get('/:id/attachments/:attachmentId/url', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getAttachmentUrl.bind(ctrl))
    f.get('/:id/attachments/:attachmentId/file', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.serveAttachmentFile.bind(ctrl))
    f.delete('/:id/attachments/:attachmentId', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.deleteAttachment.bind(ctrl))

  }, { prefix: '/api/tickets' })
}

export default tickets
