import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { UserController } from '../controllers/user.controller'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import { CreateUserSchema, UpdateUserSchema, UpdateProfileSchema, ResetUserPasswordSchema } from '../schemas/user.schema'
import { UserRole } from '../types/user-role.enum'

const users: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new UserController(f)
    const adminOnly = [f.authenticate, f.authorize([UserRole.Admin])]
    const managerAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager])]

    f.get('/profile', { schema: { tags: ['users'] }, preHandler: [f.authenticate] }, ctrl.getProfile.bind(ctrl))

    f.patch('/profile', {
      schema: { tags: ['users'], body: zodToFastifySchema(UpdateProfileSchema) },
      preHandler: [f.authenticate],
      preValidation: async (req, rep) => {
        const r = UpdateProfileSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.updateProfile.bind(ctrl))

    f.get('/', { schema: { tags: ['users'] }, preHandler: managerAbove }, ctrl.findAll.bind(ctrl))

    f.post('/', {
      schema: { tags: ['users'], body: zodToFastifySchema(CreateUserSchema) },
      preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = CreateUserSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.create.bind(ctrl))

    f.get('/:id', { schema: { tags: ['users'] }, preHandler: managerAbove }, ctrl.findById.bind(ctrl))

    f.patch('/:id', {
      schema: { tags: ['users'], body: zodToFastifySchema(UpdateUserSchema) },
      preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = UpdateUserSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.update.bind(ctrl))

    f.post('/:id/reset-password', {
      schema: { tags: ['users'], body: zodToFastifySchema(ResetUserPasswordSchema) },
      preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = ResetUserPasswordSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.resetPassword.bind(ctrl))

    f.delete('/:id', { schema: { tags: ['users'] }, preHandler: adminOnly }, ctrl.deactivate.bind(ctrl))

    f.get('/workload/:departmentId', { schema: { tags: ['users'] }, preHandler: [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager, UserRole.TeamLeader])] }, ctrl.getWorkload.bind(ctrl))

  }, { prefix: '/api/users' })
}

export default users
