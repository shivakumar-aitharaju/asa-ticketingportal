import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { DepartmentController } from '../controllers/department.controller'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import { CreateDepartmentSchema, UpdateDepartmentSchema, MapCategorySchema } from '../schemas/department.schema'
import { UserRole } from '../types/user-role.enum'

const departments: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new DepartmentController(f)
    const adminOnly = [f.authenticate, f.authorize([UserRole.Admin])]
    const staffAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager, UserRole.TeamLeader])]

    f.get('/', { schema: { tags: ['departments'] }, preHandler: [f.authenticate] }, ctrl.findAll.bind(ctrl))
    f.get('/:id', { schema: { tags: ['departments'] }, preHandler: staffAbove }, ctrl.findById.bind(ctrl))
    f.get('/:id/categories', { schema: { tags: ['departments'] }, preHandler: [f.authenticate] }, ctrl.getCategories.bind(ctrl))

    f.post('/', { schema: { tags: ['departments'], body: zodToFastifySchema(CreateDepartmentSchema) }, preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = CreateDepartmentSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.create.bind(ctrl))

    f.patch('/:id', { schema: { tags: ['departments'], body: zodToFastifySchema(UpdateDepartmentSchema) }, preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = UpdateDepartmentSchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.update.bind(ctrl))

    f.delete('/:id', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.delete.bind(ctrl))

    f.post('/:id/categories', { schema: { tags: ['departments'], body: zodToFastifySchema(MapCategorySchema) }, preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = MapCategorySchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, ctrl.mapCategory.bind(ctrl))

    f.delete('/:id/categories/:categoryId', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.unmapCategory.bind(ctrl))

    // Category member management
    f.get('/:id/members', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.getMembers.bind(ctrl))
    f.post('/:id/members', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.addMember.bind(ctrl))
    f.delete('/:id/members/:userId', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.removeMember.bind(ctrl))

  }, { prefix: '/api/departments' })
}

export default departments
