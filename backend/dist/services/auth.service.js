"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const errors_1 = require("../utils/errors");
class AuthService {
    userRepo;
    constructor(dataSource) {
        this.userRepo = dataSource.getRepository(user_entity_1.User);
    }
    async login(data) {
        const user = await this.userRepo.findOne({
            where: { email: data.email.trim().toLowerCase() },
            relations: ['department']
        });
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new errors_1.UnauthorizedError(`Account locked until ${user.lockedUntil.toISOString()}. Contact support.`);
        }
        const valid = await bcrypt_1.default.compare(data.password, user.password);
        if (!valid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await this.userRepo.save(user);
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);
        return user;
    }
    async forgotPassword(email, fastify) {
        const user = await this.userRepo.findOne({ where: { email: email.trim().toLowerCase() } });
        if (!user) {
            throw new errors_1.NotFoundError('No account found with this email address');
        }
        const resetToken = fastify.jwt.sign({ email: user.email, type: 'password_reset' }, { expiresIn: '1h' });
        const resetUrl = `${fastify.config.FRONTEND_URL}/reset-password?token=${resetToken}`;
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
    `;
        await fastify.sendEmail(user.email, 'Password Reset — ASA RaiseATicket', html);
    }
    async resetPassword(token, newPassword, fastify) {
        let decoded;
        try {
            decoded = fastify.jwt.verify(token);
        }
        catch {
            throw new errors_1.UnauthorizedError('Invalid or expired reset token. Please request a new one.');
        }
        if (decoded.type !== 'password_reset' || !decoded.email) {
            throw new errors_1.UnauthorizedError('Invalid reset token');
        }
        const user = await this.userRepo.findOne({ where: { email: decoded.email.toLowerCase() } });
        if (!user)
            throw new errors_1.UnauthorizedError('Invalid reset token');
        user.password = await bcrypt_1.default.hash(newPassword, 12);
        await this.userRepo.save(user);
    }
    async verifyResetToken(token, fastify) {
        try {
            const decoded = fastify.jwt.verify(token);
            if (decoded.type !== 'password_reset' || !decoded.email)
                return { valid: false };
            const user = await this.userRepo.findOne({ where: { email: decoded.email.toLowerCase() } });
            if (!user)
                return { valid: false };
            return { valid: true, email: decoded.email };
        }
        catch {
            return { valid: false };
        }
    }
    async getUserById(id) {
        return this.userRepo.findOne({ where: { id }, relations: ['department'] });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map