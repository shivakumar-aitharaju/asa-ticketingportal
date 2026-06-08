import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../dtos/response.dto'
import { AuthService } from '../services/auth.service'
import { AuditService } from '../services/audit.service'
import { mask, userMaskConfig } from '../utils/mask'
import { LoginBody, ForgotPasswordBody, ResetPasswordBody } from '../schemas/auth.schema'

export class AuthController {
  private authService: AuthService
  private auditService: AuditService
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.authService = new AuthService(fastify.dataSource)
    this.auditService = new AuditService(fastify.dataSource)
    this.fastify = fastify
  }

  async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    const user = await this.authService.login(request.body)

    const token = this.fastify.jwt.sign({ id: user.id, role: user.role, departmentId: user.departmentId })
    const refreshToken = this.fastify.config.JWT_REFRESH_SECRET
      ? this.fastify.jwt.refresh.sign({ id: user.id })
      : this.fastify.jwt.sign({ id: user.id, isRefresh: true }, { expiresIn: '30d' })

    this.auditService.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      resource: 'auth',
      resourceId: user.id,
      newValue: { role: user.role, ip: request.ip },
    }).catch(() => {}) // non-blocking

    reply.send(successResponse({ user: mask(user, userMaskConfig), token, refreshToken }, 'Login successful'))
  }

  async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordBody }>, reply: FastifyReply) {
    await this.authService.forgotPassword(request.body.email, this.fastify)
    reply.send(successResponse(null, 'Password reset link sent to your email.'))
  }

  async verifyResetToken(request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) {
    const result = await this.authService.verifyResetToken(request.query.token, this.fastify)
    reply.send(successResponse(result, result.valid ? 'Token is valid' : 'Token is invalid or expired'))
  }

  async resetPassword(request: FastifyRequest<{ Body: ResetPasswordBody }>, reply: FastifyReply) {
    await this.authService.resetPassword(request.body.token, request.body.password, this.fastify)
    reply.send(successResponse(null, 'Password reset successfully. You can now login.'))
  }

  async refresh(request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
    const { refreshToken } = request.body

    try {
      const decoded = this.fastify.config.JWT_REFRESH_SECRET
        ? await this.fastify.jwt.refresh.verify<{ id: string }>(refreshToken)
        : await this.fastify.jwt.verify<{ id: string }>(refreshToken)

      if (!decoded.id) throw new Error('Invalid token')

      const user = await this.authService.getUserById(decoded.id)
      if (!user) throw new Error('User not found')

      const token = this.fastify.jwt.sign({ id: user.id, role: user.role, departmentId: user.departmentId })
      const newRefreshToken = this.fastify.config.JWT_REFRESH_SECRET
        ? this.fastify.jwt.refresh.sign({ id: user.id })
        : this.fastify.jwt.sign({ id: user.id, isRefresh: true }, { expiresIn: '30d' })

      reply.send(successResponse({ token, refreshToken: newRefreshToken }, 'Token refreshed'))
    } catch {
      reply.code(401).send({ error: { message: 'Invalid or expired refresh token', statusCode: 401 } })
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const decoded = request.user as { id: string }
    const user = await this.authService.getUserById(decoded.id)
    if (!user) return reply.code(401).send({ error: { message: 'User not found', statusCode: 401 } })
    reply.send(successResponse(mask(user, userMaskConfig)))
  }
}
