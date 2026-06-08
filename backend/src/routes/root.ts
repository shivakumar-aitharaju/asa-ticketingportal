import type { FastifyPluginAsync } from 'fastify/types/plugin'

const root: FastifyPluginAsync = async function (fastify) {
  fastify.get('/health', {
    schema: { tags: ['system'], description: 'Health check' }
  }, async (req, rep) => {
    rep.send({ status: 'ok', timestamp: new Date().toISOString(), service: 'raiseaticket-backend' })
  })
}

export default root
