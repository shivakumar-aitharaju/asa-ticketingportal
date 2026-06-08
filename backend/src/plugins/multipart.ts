import multipart from '@fastify/multipart'
import fp from 'fastify-plugin'

export default fp(async function (fastify) {
  fastify.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB
      files: 5
    }
  })
}, { name: 'multipart' })
