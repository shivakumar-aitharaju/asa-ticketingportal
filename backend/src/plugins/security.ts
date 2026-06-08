import helmet from '@fastify/helmet'
import fp from 'fastify-plugin'

export default fp(async function (fastify) {
  await fastify.register(helmet, {
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  })
}, { name: 'security', dependencies: ['env'] })
