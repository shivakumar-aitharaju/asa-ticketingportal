"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_controller_1 = require("../controllers/analytics.controller");
const user_role_enum_1 = require("../types/user-role.enum");
const analytics = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new analytics_controller_1.AnalyticsController(f);
        const staffAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager, user_role_enum_1.UserRole.TeamLeader])];
        const managerAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager])];
        f.get('/overview', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getDashboardOverview.bind(ctrl));
        f.get('/trend', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getTicketTrend.bind(ctrl));
        f.get('/agents', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getAgentPerformance.bind(ctrl));
        f.get('/departments', { schema: { tags: ['analytics'] }, preHandler: managerAbove }, ctrl.getDepartmentBreakdown.bind(ctrl));
        f.get('/stats/status', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getStatusDistribution.bind(ctrl));
        f.get('/stats/priority', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getPriorityDistribution.bind(ctrl));
        f.get('/monthly', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getMonthlyTrend.bind(ctrl));
        f.get('/resolution-time', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getAvgResolutionTime.bind(ctrl));
        f.get('/sla-trend', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getSLATrend.bind(ctrl));
    }, { prefix: '/api/analytics' });
};
exports.default = analytics;
//# sourceMappingURL=analytics.js.map