import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../dtos/response.dto'
import { AnalyticsService } from '../services/analytics.service'
import { UserRole } from '../types/user-role.enum'

export class AnalyticsController {
  private service: AnalyticsService

  constructor(fastify: FastifyInstance) {
    this.service = new AnalyticsService(fastify.dataSource)
  }

  private getUser(req: FastifyRequest) {
    return req.user as { id: string; role: UserRole; departmentId?: string }
  }

  private resolveScope(req: FastifyRequest, queryDeptId?: string): string | undefined {
    const { role, departmentId } = this.getUser(req)
    if (role === UserRole.TeamLeader) return departmentId
    return queryDeptId
  }

  async getDashboardOverview(
    req: FastifyRequest<{ Querystring: { departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const data = await this.service.getDashboardOverview(deptId)
    rep.send(successResponse(data))
  }

  async getTicketTrend(
    req: FastifyRequest<{ Querystring: { days?: number; departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const days = req.query.days ? Number(req.query.days) : 30
    const data = await this.service.getTicketTrend(days, deptId)
    rep.send(successResponse(data))
  }

  async getAgentPerformance(
    req: FastifyRequest<{ Querystring: { departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const data = await this.service.getAgentPerformance(deptId)
    rep.send(successResponse(data))
  }

  async getDepartmentBreakdown(req: FastifyRequest, rep: FastifyReply) {
    const data = await this.service.getDepartmentBreakdown()
    rep.send(successResponse(data))
  }

  async getStatusDistribution(
    req: FastifyRequest<{ Querystring: { departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const data = await this.service.getStatusDistribution(deptId)
    rep.send(successResponse(data))
  }

  async getPriorityDistribution(
    req: FastifyRequest<{ Querystring: { departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const data = await this.service.getPriorityDistribution(deptId)
    rep.send(successResponse(data))
  }

  async getMonthlyTrend(
    req: FastifyRequest<{ Querystring: { year?: number; departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear()
    const data = await this.service.getMonthlyTrend(year, deptId)
    rep.send(successResponse(data))
  }

  async getAvgResolutionTime(
    req: FastifyRequest<{ Querystring: { departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const data = await this.service.getAvgResolutionTime(deptId)
    rep.send(successResponse(data))
  }

  async getSLATrend(
    req: FastifyRequest<{ Querystring: { days?: number; departmentId?: string } }>,
    rep: FastifyReply
  ) {
    const deptId = this.resolveScope(req, req.query.departmentId)
    const days = req.query.days ? Number(req.query.days) : 30
    const data = await this.service.getSLATrend(days, deptId)
    rep.send(successResponse(data))
  }
}
