import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { SLAService } from '../services/sla.service'
import { successResponse } from '../dtos/response.dto'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import { CreateSLAConfigSchema, UpdateSLAConfigSchema } from '../schemas/sla.schema'
import { UserRole } from '../types/user-role.enum'

const sla: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const service = new SLAService(f.dataSource)
    const adminOnly = [f.authenticate, f.authorize([UserRole.Admin])]
    const managerAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager])]

    f.get('/configs', { schema: { tags: ['sla'] }, preHandler: managerAbove }, async (req, rep) => {
      const configs = await service.getAllConfigs()
      rep.send(successResponse(configs))
    })

    f.post('/configs', {
      schema: { tags: ['sla'], body: zodToFastifySchema(CreateSLAConfigSchema) },
      preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = CreateSLAConfigSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, async (req, rep) => {
      const config = await service.createConfig(req.body as any)
      rep.code(201).send(successResponse(config, 'SLA configuration created'))
    })

    f.patch('/configs/:id', {
      schema: { tags: ['sla'], body: zodToFastifySchema(UpdateSLAConfigSchema) },
      preHandler: adminOnly,
      preValidation: async (req: any, rep) => {
        const r = UpdateSLAConfigSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, async (req: any, rep) => {
      const config = await service.updateConfig(req.params.id, req.body)
      rep.send(successResponse(config, 'SLA configuration updated'))
    })

  }, { prefix: '/api/sla' })
}

export default sla
