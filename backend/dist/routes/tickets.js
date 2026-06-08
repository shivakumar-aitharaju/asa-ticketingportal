"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ticket_controller_1 = require("../controllers/ticket.controller");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const ticket_schema_1 = require("../schemas/ticket.schema");
const user_role_enum_1 = require("../types/user-role.enum");
const tickets = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new ticket_controller_1.TicketController(f);
        const auth = [f.authenticate];
        const staffOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager, user_role_enum_1.UserRole.TeamLeader, user_role_enum_1.UserRole.Agent])];
        const tlAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager, user_role_enum_1.UserRole.TeamLeader])];
        f.get('/', { schema: { tags: ['tickets'], security: [{ bearerAuth: [] }] }, preHandler: auth }, ctrl.findAll.bind(ctrl));
        f.post('/', {
            schema: { tags: ['tickets'], security: [{ bearerAuth: [] }], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.CreateTicketSchema) },
            preHandler: auth,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.CreateTicketSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.create.bind(ctrl));
        f.get('/:id', { schema: { tags: ['tickets'], security: [{ bearerAuth: [] }] }, preHandler: auth }, ctrl.findById.bind(ctrl));
        f.get('/:id/messages', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getMessages.bind(ctrl));
        f.post('/:id/messages', {
            schema: { tags: ['tickets'], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.AddMessageSchema) },
            preHandler: auth,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.AddMessageSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.addMessage.bind(ctrl));
        f.post('/:id/assign', {
            schema: { tags: ['tickets'], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.AssignTicketSchema) },
            preHandler: tlAbove,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.AssignTicketSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.assign.bind(ctrl));
        f.post('/:id/resolve', {
            schema: { tags: ['tickets'], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.ResolveTicketSchema) },
            preHandler: staffOnly,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.ResolveTicketSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.resolve.bind(ctrl));
        f.post('/:id/close', { schema: { tags: ['tickets'] }, preHandler: staffOnly }, ctrl.close.bind(ctrl));
        f.post('/:id/reopen', {
            schema: { tags: ['tickets'], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.ReopenTicketSchema) },
            preHandler: auth,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.ReopenTicketSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.reopen.bind(ctrl));
        f.post('/:id/escalate', {
            schema: { tags: ['tickets'], body: (0, zod_to_swagger_1.zodToFastifySchema)(ticket_schema_1.EscalateTicketSchema) },
            preHandler: tlAbove,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.EscalateTicketSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.escalate.bind(ctrl));
        f.get('/:id/history', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getHistory.bind(ctrl));
        f.get('/:id/sla', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getSLA.bind(ctrl));
        f.post('/:id/client-resolve', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.clientResolve.bind(ctrl));
        f.post('/:id/rate', {
            schema: { tags: ['tickets'] },
            preHandler: auth,
            preValidation: async (req, rep) => {
                const r = ticket_schema_1.RatingSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400 } });
                req.body = r.data;
            }
        }, ctrl.rateTicket.bind(ctrl));
        f.get('/:id/attachments', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.listAttachments.bind(ctrl));
        f.post('/:id/attachments', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.uploadAttachment.bind(ctrl));
        f.get('/:id/attachments/:attachmentId/url', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.getAttachmentUrl.bind(ctrl));
        f.get('/:id/attachments/:attachmentId/file', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.serveAttachmentFile.bind(ctrl));
        f.delete('/:id/attachments/:attachmentId', { schema: { tags: ['tickets'] }, preHandler: auth }, ctrl.deleteAttachment.bind(ctrl));
    }, { prefix: '/api/tickets' });
};
exports.default = tickets;
//# sourceMappingURL=tickets.js.map