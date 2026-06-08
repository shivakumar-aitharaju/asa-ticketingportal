import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { AnalyticsController } from '../controllers/analytics.controller'
import { UserRole } from '../types/user-role.enum'

const analytics: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new AnalyticsController(f)
    const staffAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager, UserRole.TeamLeader])]
    const managerAbove = [f.authenticate, f.authorize([UserRole.Admin, UserRole.Manager])]

    f.get('/overview', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getDashboardOverview.bind(ctrl))
    f.get('/trend', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getTicketTrend.bind(ctrl))
    f.get('/agents', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getAgentPerformance.bind(ctrl))
    f.get('/departments', { schema: { tags: ['analytics'] }, preHandler: managerAbove }, ctrl.getDepartmentBreakdown.bind(ctrl))

    f.get('/stats/status', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getStatusDistribution.bind(ctrl))
    f.get('/stats/priority', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getPriorityDistribution.bind(ctrl))
    f.get('/monthly', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getMonthlyTrend.bind(ctrl))
    f.get('/resolution-time', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getAvgResolutionTime.bind(ctrl))
    f.get('/sla-trend', { schema: { tags: ['analytics'] }, preHandler: staffAbove }, ctrl.getSLATrend.bind(ctrl))

  }, { prefix: '/api/analytics' })
}

export default analytics
