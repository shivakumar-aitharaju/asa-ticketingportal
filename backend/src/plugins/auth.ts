import jwt from '@fastify/jwt'
import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { UserRole } from '../types/user-role.enum'


export default fp(async function (fastify) {
  await fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: fastify.config.JWT_EXPIRES_IN || '30m' }
  })

  if (fastify.config.JWT_REFRESH_SECRET) {
    await fastify.register(jwt, {
      secret: fastify.config.JWT_REFRESH_SECRET,
      namespace: 'refresh',
      sign: { expiresIn: fastify.config.JWT_REFRESH_EXPIRES_IN || '30d' }
    })
  }

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: { message: 'Unauthorized', statusCode: 401 } })
    }
  })

  fastify.decorate('getUserId', function (request: FastifyRequest): string | null {
    try {
      const decoded = request.user as { id: string; role?: UserRole }
      return decoded?.id || null
    } catch { return null }
  })

  fastify.decorate('getUserRole', function (request: FastifyRequest): UserRole | null {
    try {
      const decoded = request.user as { id: string; role?: UserRole }
      return decoded?.role || null
    } catch { return null }
  })

  fastify.decorate('authorize', function (roles: UserRole[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const userRole = fastify.getUserRole(request)
      if (!userRole || !roles.includes(userRole)) {
        reply.code(403).send({ error: { message: 'Forbidden: Insufficient permissions', statusCode: 403 } })
      }
    }
  })
}, { name: 'auth', dependencies: ['env', 'typeorm'] })
