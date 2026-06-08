import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'
import { DataSource, Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { UnauthorizedError, NotFoundError } from '../utils/errors'
import { LoginBody } from '../schemas/auth.schema'

export class AuthService {
  private userRepo: Repository<User>

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(User)
  }

  async login(data: LoginBody): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email: data.email.trim().toLowerCase() },
      relations: ['department']
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError(`Account locked until ${user.lockedUntil.toISOString()}. Contact support.`)
    }

    const valid = await bcrypt.compare(data.password, user.password)

    if (!valid) {
      user.failedLoginAttempts += 1
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 min
      }
      await this.userRepo.save(user)
      throw new UnauthorizedError('Invalid email or password')
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await this.userRepo.save(user)

    return user
  }

  async forgotPassword(email: string, fastify: FastifyInstance): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email: email.trim().toLowerCase() } })

    if (!user) {
      throw new NotFoundError('No account found with this email address')
    }

    const resetToken = fastify.jwt.sign({ email: user.email, type: 'password_reset' }, { expiresIn: '1h' })
    const resetUrl = `${fastify.config.FRONTEND_URL}/reset-password?token=${resetToken}`

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#1d4ed8;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:20px">ASA RaiseATicket Portal</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1d4ed8">Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to set a new password.</p>
            <p style="margin:28px 0;text-align:center">
              <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block">
                Reset Password
              </a>
            </p>
            <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body></html>
    `

    await fastify.sendEmail(user.email, 'Password Reset — ASA RaiseATicket', html)
  }

  async resetPassword(token: string, newPassword: string, fastify: FastifyInstance): Promise<void> {
    let decoded: { email?: string; type?: string }
    try {
      decoded = fastify.jwt.verify(token) as { email?: string; type?: string }
    } catch {
      throw new UnauthorizedError('Invalid or expired reset token. Please request a new one.')
    }

    if (decoded.type !== 'password_reset' || !decoded.email) {
      throw new UnauthorizedError('Invalid reset token')
    }

    const user = await this.userRepo.findOne({ where: { email: decoded.email.toLowerCase() } })
    if (!user) throw new UnauthorizedError('Invalid reset token')

    user.password = await bcrypt.hash(newPassword, 12)
    await this.userRepo.save(user)
  }

  async verifyResetToken(token: string, fastify: FastifyInstance): Promise<{ valid: boolean; email?: string }> {
    try {
      const decoded = fastify.jwt.verify(token) as { email?: string; type?: string }
      if (decoded.type !== 'password_reset' || !decoded.email) return { valid: false }
      const user = await this.userRepo.findOne({ where: { email: decoded.email.toLowerCase() } })
      if (!user) return { valid: false }
      return { valid: true, email: decoded.email }
    } catch {
      return { valid: false }
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['department'] })
  }
}
