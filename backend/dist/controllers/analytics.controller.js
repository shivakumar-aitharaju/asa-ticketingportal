"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const analytics_service_1 = require("../services/analytics.service");
const user_role_enum_1 = require("../types/user-role.enum");
class AnalyticsController {
    service;
    constructor(fastify) {
        this.service = new analytics_service_1.AnalyticsService(fastify.dataSource);
    }
    getUser(req) {
        return req.user;
    }
    resolveScope(req, queryDeptId) {
        const { role, departmentId } = this.getUser(req);
        if (role === user_role_enum_1.UserRole.TeamLeader)
            return departmentId;
        return queryDeptId;
    }
    async getDashboardOverview(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const data = await this.service.getDashboardOverview(deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getTicketTrend(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const days = req.query.days ? Number(req.query.days) : 30;
        const data = await this.service.getTicketTrend(days, deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getAgentPerformance(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const data = await this.service.getAgentPerformance(deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getDepartmentBreakdown(req, rep) {
        const data = await this.service.getDepartmentBreakdown();
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getStatusDistribution(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const data = await this.service.getStatusDistribution(deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getPriorityDistribution(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const data = await this.service.getPriorityDistribution(deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getMonthlyTrend(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const data = await this.service.getMonthlyTrend(year, deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getAvgResolutionTime(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const data = await this.service.getAvgResolutionTime(deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
    async getSLATrend(req, rep) {
        const deptId = this.resolveScope(req, req.query.departmentId);
        const days = req.query.days ? Number(req.query.days) : 30;
        const data = await this.service.getSLATrend(days, deptId);
        rep.send((0, response_dto_1.successResponse)(data));
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map