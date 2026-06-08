import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import cors from '@fastify/cors'
import { HttpError } from '@fastify/sensible'
import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { join } from 'node:path'
import { ErrorResponse } from './dtos/response.dto'
import envPlugin from './plugins/env'
import { startEmailIngest } from './services/email-ingest.service'

export interface AppOptions extends Partial<AutoloadPluginOptions> {}

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async function (fastify, opts): Promise<void> {
  await fastify.register(envPlugin)

  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })

  fastify.setErrorHandler(function (error: any, request, reply) {
    fastify.log.error(error)

    const statusCode = error instanceof HttpError || error.statusCode
      ? (error.statusCode ?? 500)
      : 500

    const message = error.message ?? 'Internal Server Error'
    const nodeEnv = (fastify as any).config?.NODE_ENV ?? 'development'

    const errorResponse: ErrorResponse = {
      error: {
        message,
        statusCode,
        ...(error.details && { details: error.details }),
        ...(nodeEnv === 'development' && { stack: error.stack })
      }
    }

    reply.code(statusCode).send(errorResponse)
  })

  fastify.setNotFoundHandler(function (request, reply) {
    reply.code(404).send({
      error: { message: 'Route not found', statusCode: 404, details: { path: request.url } }
    })
  })

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
    ignorePattern: /env\.(ts|js)$/
  })

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  })

  fastify.after(() => {
    fastify.ready().then(() => {
      const ds = (fastify as any).dataSource
      if (ds) startEmailIngest(fastify, ds).catch(() => {})
    })
  })
}

export default app
export { app, options }
