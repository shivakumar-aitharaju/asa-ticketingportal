import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { CategoryService } from '../services/category.service'
import { successResponse } from '../dtos/response.dto'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import { CreateCategorySchema, UpdateCategorySchema } from '../schemas/category.schema'
import { UserRole } from '../types/user-role.enum'

const categories: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const service = new CategoryService(f.dataSource)
    const adminOnly = [f.authenticate, f.authorize([UserRole.Admin])]

    f.get('/', { schema: { tags: ['categories'] }, preHandler: [f.authenticate] }, async (req, rep) => {
      const cats = await service.findAll()
      rep.send(successResponse(cats))
    })

    f.post('/', { schema: { tags: ['categories'], body: zodToFastifySchema(CreateCategorySchema) }, preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = CreateCategorySchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, async (req, rep) => {
      const cat = await service.create(req.body as any)
      rep.code(201).send(successResponse(cat, 'Category created'))
    })

    f.patch('/:id', { schema: { tags: ['categories'], body: zodToFastifySchema(UpdateCategorySchema) }, preHandler: adminOnly,
      preValidation: async (req, rep) => {
        const r = UpdateCategorySchema.safeParse((req as any).body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        ;(req as any).body = r.data
      }
    }, async (req: any, rep) => {
      const cat = await service.update(req.params.id, req.body)
      rep.send(successResponse(cat, 'Category updated'))
    })

    f.delete('/:id', { schema: { tags: ['categories'] }, preHandler: adminOnly }, async (req: any, rep) => {
      await service.delete(req.params.id)
      rep.send(successResponse(null, 'Category deleted'))
    })

  }, { prefix: '/api/categories' })
}

export default categories
