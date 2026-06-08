"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const audit_service_1 = require("../services/audit.service");
class AuditController {
    service;
    constructor(fastify) {
        this.service = new audit_service_1.AuditService(fastify.dataSource);
    }
    async getAll(req, rep) {
        const { page = 1, limit = 50, resource, action } = req.query;
        const result = await this.service.getAll(Number(page), Number(limit), resource, action);
        rep.send(result);
    }
    async getForResource(req, rep) {
        const { resource, resourceId } = req.params;
        const data = await this.service.getForResource(resource, resourceId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
}
exports.AuditController = AuditController;
//# sourceMappingURL=audit.controller.js.map