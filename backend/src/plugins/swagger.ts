import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'

export default fp(async function (fastify) {
  await fastify.register(swagger, {
    openapi: {
      info: { title: 'ASA RaiseATicket API', description: 'Enterprise ticketing portal API', version: '1.0.0' },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'tickets', description: 'Ticket management' },
        { name: 'users', description: 'User management' },
        { name: 'departments', description: 'Departments' },
        { name: 'categories', description: 'Ticket categories' },
        { name: 'notifications', description: 'Notifications' },
        { name: 'analytics', description: 'Analytics & reports' },
        { name: 'audit', description: 'Audit logs' },
        { name: 'sla', description: 'SLA configuration' },
        { name: 'uploads', description: 'File uploads' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false }
  })
}, { name: 'swagger', dependencies: ['env'] })
