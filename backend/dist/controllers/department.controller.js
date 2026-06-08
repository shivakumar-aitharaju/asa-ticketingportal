"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const department_service_1 = require("../services/department.service");
class DepartmentController {
    service;
    constructor(fastify) {
        this.service = new department_service_1.DepartmentService(fastify.dataSource);
    }
    async findAll(_request, reply) {
        const departments = await this.service.findAll();
        reply.send((0, response_dto_1.successResponse)(departments));
    }
    async findById(request, reply) {
        const dept = await this.service.findById(request.params.id);
        reply.send((0, response_dto_1.successResponse)(dept));
    }
    async create(request, reply) {
        const dept = await this.service.create(request.body);
        reply.code(201).send((0, response_dto_1.successResponse)(dept, 'Department created'));
    }
    async update(request, reply) {
        const dept = await this.service.update(request.params.id, request.body);
        reply.send((0, response_dto_1.successResponse)(dept, 'Department updated'));
    }
    async delete(request, reply) {
        await this.service.softDelete(request.params.id);
        reply.send((0, response_dto_1.successResponse)(null, 'Department deleted'));
    }
    async mapCategory(request, reply) {
        await this.service.mapCategory(request.params.id, request.body.categoryId);
        reply.send((0, response_dto_1.successResponse)(null, 'Category mapped to department'));
    }
    async unmapCategory(request, reply) {
        await this.service.unmapCategory(request.params.id, request.params.categoryId);
        reply.send((0, response_dto_1.successResponse)(null, 'Category removed from department'));
    }
    async getCategories(request, reply) {
        const categories = await this.service.getCategories(request.params.id);
        reply.send((0, response_dto_1.successResponse)(categories));
    }
    async getMembers(request, reply) {
        const members = await this.service.getMembers(request.params.id);
        reply.send((0, response_dto_1.successResponse)(members));
    }
    async addMember(request, reply) {
        await this.service.addMember(request.params.id, request.body.userId);
        reply.code(201).send((0, response_dto_1.successResponse)(null, 'Member added to category'));
    }
    async removeMember(request, reply) {
        await this.service.removeMember(request.params.id, request.params.userId);
        reply.send((0, response_dto_1.successResponse)(null, 'Member removed from category'));
    }
}
exports.DepartmentController = DepartmentController;
//# sourceMappingURL=department.controller.js.map