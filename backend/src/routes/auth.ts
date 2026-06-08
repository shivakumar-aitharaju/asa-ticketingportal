import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { z } from 'zod'
import { AuthController } from '../controllers/auth.controller'
import { zodToFastifySchema } from '../lib/zod-to-swagger'
import { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/auth.schema'

const auth: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new AuthController(f)

    f.post<{ Body: any }>('/login', {
      schema: {
        description: 'Login with email and password',
        tags: ['auth'],
        body: zodToFastifySchema(LoginSchema),
      },
      preValidation: async (req, rep) => {
        const r = LoginSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.login.bind(ctrl))

    f.post<{ Body: any }>('/forgot-password', {
      schema: { description: 'Send password reset email', tags: ['auth'], body: zodToFastifySchema(ForgotPasswordSchema) },
      preValidation: async (req, rep) => {
        const r = ForgotPasswordSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.forgotPassword.bind(ctrl))

    f.get<{ Querystring: { token: string } }>('/verify-reset-token', {
      schema: { description: 'Verify password reset token', tags: ['auth'], querystring: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } }
    }, ctrl.verifyResetToken.bind(ctrl))

    f.post<{ Body: any }>('/reset-password', {
      schema: { description: 'Reset password using token', tags: ['auth'], body: zodToFastifySchema(ResetPasswordSchema) },
      preValidation: async (req, rep) => {
        const r = ResetPasswordSchema.safeParse(req.body)
        if (!r.success) return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } })
        req.body = r.data
      }
    }, ctrl.resetPassword.bind(ctrl))

    f.post<{ Body: { refreshToken: string } }>('/refresh', {
      schema: { description: 'Refresh access token', tags: ['auth'], body: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } }
    }, ctrl.refresh.bind(ctrl))

    f.get('/me', {
      schema: { description: 'Get current user', tags: ['auth'], security: [{ bearerAuth: [] }] },
      preHandler: [f.authenticate]
    }, ctrl.me.bind(ctrl))

  }, { prefix: '/api/auth' })
}

export default auth
