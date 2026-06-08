import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { AuditController } from '../controllers/audit.controller'
import { UserRole } from '../types/user-role.enum'

const audit: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new AuditController(f)
    const adminOnly = [f.authenticate, f.authorize([UserRole.Admin])]

    f.get('/', { schema: { tags: ['audit'] }, preHandler: adminOnly }, ctrl.getAll.bind(ctrl))
    f.get('/:resource/:resourceId', { schema: { tags: ['audit'] }, preHandler: adminOnly }, ctrl.getForResource.bind(ctrl))

  }, { prefix: '/api/audit' })
}

export default audit
