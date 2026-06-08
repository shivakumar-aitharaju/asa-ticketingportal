"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const auth_service_1 = require("../services/auth.service");
const audit_service_1 = require("../services/audit.service");
const mask_1 = require("../utils/mask");
class AuthController {
    authService;
    auditService;
    fastify;
    constructor(fastify) {
        this.authService = new auth_service_1.AuthService(fastify.dataSource);
        this.auditService = new audit_service_1.AuditService(fastify.dataSource);
        this.fastify = fastify;
    }
    async login(request, reply) {
        const user = await this.authService.login(request.body);
        const token = this.fastify.jwt.sign({ id: user.id, role: user.role, departmentId: user.departmentId });
        const refreshToken = this.fastify.config.JWT_REFRESH_SECRET
            ? this.fastify.jwt.refresh.sign({ id: user.id })
            : this.fastify.jwt.sign({ id: user.id, isRefresh: true }, { expiresIn: '30d' });
        this.auditService.log({
            actorId: user.id,
            action: 'USER_LOGIN',
            resource: 'auth',
            resourceId: user.id,
            newValue: { role: user.role, ip: request.ip },
        }).catch(() => { });
        reply.send((0, response_dto_1.successResponse)({ user: (0, mask_1.mask)(user, mask_1.userMaskConfig), token, refreshToken }, 'Login successful'));
    }
    async forgotPassword(request, reply) {
        await this.authService.forgotPassword(request.body.email, this.fastify);
        reply.send((0, response_dto_1.successResponse)(null, 'Password reset link sent to your email.'));
    }
    async verifyResetToken(request, reply) {
        const result = await this.authService.verifyResetToken(request.query.token, this.fastify);
        reply.send((0, response_dto_1.successResponse)(result, result.valid ? 'Token is valid' : 'Token is invalid or expired'));
    }
    async resetPassword(request, reply) {
        await this.authService.resetPassword(request.body.token, request.body.password, this.fastify);
        reply.send((0, response_dto_1.successResponse)(null, 'Password reset successfully. You can now login.'));
    }
    async refresh(request, reply) {
        const { refreshToken } = request.body;
        try {
            const decoded = this.fastify.config.JWT_REFRESH_SECRET
                ? await this.fastify.jwt.refresh.verify(refreshToken)
                : await this.fastify.jwt.verify(refreshToken);
            if (!decoded.id)
                throw new Error('Invalid token');
            const user = await this.authService.getUserById(decoded.id);
            if (!user)
                throw new Error('User not found');
            const token = this.fastify.jwt.sign({ id: user.id, role: user.role, departmentId: user.departmentId });
            const newRefreshToken = this.fastify.config.JWT_REFRESH_SECRET
                ? this.fastify.jwt.refresh.sign({ id: user.id })
                : this.fastify.jwt.sign({ id: user.id, isRefresh: true }, { expiresIn: '30d' });
            reply.send((0, response_dto_1.successResponse)({ token, refreshToken: newRefreshToken }, 'Token refreshed'));
        }
        catch {
            reply.code(401).send({ error: { message: 'Invalid or expired refresh token', statusCode: 401 } });
        }
    }
    async me(request, reply) {
        const decoded = request.user;
        const user = await this.authService.getUserById(decoded.id);
        if (!user)
            return reply.code(401).send({ error: { message: 'User not found', statusCode: 401 } });
        reply.send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig)));
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map