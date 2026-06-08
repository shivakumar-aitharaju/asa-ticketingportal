"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const user_service_1 = require("../services/user.service");
const audit_service_1 = require("../services/audit.service");
const mask_1 = require("../utils/mask");
class UserController {
    service;
    auditService;
    constructor(fastify) {
        this.service = new user_service_1.UserService(fastify.dataSource);
        this.auditService = new audit_service_1.AuditService(fastify.dataSource);
    }
    async findAll(request, reply) {
        const { page = 1, limit = 25, search, role, departmentId } = request.query;
        const result = await this.service.findAll(page, limit, search, role, departmentId);
        reply.send((0, response_dto_1.paginatedResponse)(result.data.map(u => (0, mask_1.mask)(u, mask_1.userMaskConfig)), result.pagination));
    }
    async findById(request, reply) {
        const user = await this.service.findById(request.params.id);
        reply.send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig)));
    }
    async create(request, reply) {
        const actor = request.user;
        const user = await this.service.create(request.body);
        this.auditService.log({
            actorId: actor.id,
            action: 'USER_CREATED',
            resource: 'users',
            resourceId: user.id,
            newValue: { email: user.email, role: user.role },
        }).catch(() => { });
        reply.code(201).send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig), 'User created successfully'));
    }
    async update(request, reply) {
        const actor = request.user;
        const user = await this.service.update(request.params.id, request.body);
        this.auditService.log({
            actorId: actor.id,
            action: 'USER_UPDATED',
            resource: 'users',
            resourceId: user.id,
            newValue: request.body,
        }).catch(() => { });
        reply.send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig), 'User updated'));
    }
    async resetPassword(request, reply) {
        await this.service.resetPassword(request.params.id, request.body.password);
        reply.send((0, response_dto_1.successResponse)(null, 'Password reset successfully'));
    }
    async deactivate(request, reply) {
        await this.service.deactivate(request.params.id);
        reply.send((0, response_dto_1.successResponse)(null, 'User deactivated'));
    }
    async getProfile(request, reply) {
        const { id } = request.user;
        const user = await this.service.findById(id);
        reply.send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig)));
    }
    async updateProfile(request, reply) {
        const { id } = request.user;
        const user = await this.service.updateProfile(id, request.body);
        reply.send((0, response_dto_1.successResponse)((0, mask_1.mask)(user, mask_1.userMaskConfig), 'Profile updated'));
    }
    async getWorkload(request, reply) {
        const workload = await this.service.getWorkload(request.params.departmentId);
        reply.send((0, response_dto_1.successResponse)(workload));
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map