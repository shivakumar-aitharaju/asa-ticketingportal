import type { FastifyInstance } from 'fastify'
import { DataSource, Repository } from 'typeorm'
import { SLAConfiguration } from '../entities/sla-configuration.entity'
import { SLATracking, SLAStatus } from '../entities/sla-tracking.entity'
import { Ticket } from '../entities/ticket.entity'
import { Priority } from '../types/priority.enum'
import { addBusinessMinutes } from '../utils/business-hours'
import { NotificationService } from './notification.service'
import { NotificationType } from '../entities/notification.entity'

export class SLAService {
  private slaConfigRepo: Repository<SLAConfiguration>
  private slaTrackingRepo: Repository<SLATracking>
  private ticketRepo: Repository<Ticket>

  constructor(dataSource: DataSource) {
    this.slaConfigRepo = dataSource.getRepository(SLAConfiguration)
    this.slaTrackingRepo = dataSource.getRepository(SLATracking)
    this.ticketRepo = dataSource.getRepository(Ticket)
  }

  async startTracking(ticket: Ticket): Promise<SLATracking> {
    const config = await this.findConfig(ticket.priority, ticket.departmentId, ticket.categoryId)

    if (!config) {
      throw new Error(`No SLA config found for priority ${ticket.priority}`)
    }

    const now = new Date()
    const firstResponseDue = addBusinessMinutes(now, config.firstResponseMinutes)
    const resolutionDue = addBusinessMinutes(now, config.resolutionMinutes)

    const tracking = this.slaTrackingRepo.create({
      ticketId: ticket.id,
      slaConfigId: config.id,
      firstResponseDue,
      resolutionDue,
      status: SLAStatus.OnTrack,
    })

    return this.slaTrackingRepo.save(tracking)
  }

  async updateStatus(ticketId: string): Promise<SLATracking | null> {
    const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } })
    if (!tracking || tracking.resolutionMet !== null) return tracking

    const now = new Date()
    const totalMs = tracking.resolutionDue.getTime() - tracking.ticketId.length // just to reference it
    const elapsed = now.getTime() - (tracking.resolutionDue.getTime() -
      (await this.slaConfigRepo.findOne({ where: { id: tracking.slaConfigId } }))!.resolutionMinutes * 60000)
    const remaining = tracking.resolutionDue.getTime() - now.getTime()
    const totalDuration = tracking.resolutionDue.getTime() -
      (now.getTime() - elapsed)
    const pct = elapsed / totalDuration

    let newStatus = SLAStatus.OnTrack
    if (now > tracking.resolutionDue) {
      newStatus = SLAStatus.Breached
    } else if (pct > 0.8) {
      newStatus = SLAStatus.AtRisk
    }

    if (tracking.status !== newStatus) {
      tracking.status = newStatus
      await this.slaTrackingRepo.save(tracking)
    }

    return tracking
  }

  async markFirstResponse(ticketId: string): Promise<void> {
    const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } })
    if (!tracking || tracking.firstResponseMet !== null) return

    const now = new Date()
    tracking.firstResponseAt = now
    tracking.firstResponseMet = now <= tracking.firstResponseDue
    await this.slaTrackingRepo.save(tracking)
  }

  async markResolved(ticketId: string): Promise<void> {
    const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } })
    if (!tracking) return

    const now = new Date()
    tracking.resolvedAt = now
    tracking.resolutionMet = now <= tracking.resolutionDue
    tracking.status = tracking.resolutionMet ? SLAStatus.Met : SLAStatus.Breached
    await this.slaTrackingRepo.save(tracking)
  }

  async pauseTimer(ticketId: string): Promise<void> {
    const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } })
    if (!tracking || tracking.pausedAt) return

    tracking.pausedAt = new Date()
    await this.slaTrackingRepo.save(tracking)
  }

  async resumeTimer(ticketId: string): Promise<void> {
    const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } })
    if (!tracking || !tracking.pausedAt) return

    const pausedMinutes = Math.floor((new Date().getTime() - tracking.pausedAt.getTime()) / 60000)
    tracking.totalPausedMinutes += pausedMinutes
    // Extend deadlines by paused time
    tracking.firstResponseDue = new Date(tracking.firstResponseDue.getTime() + pausedMinutes * 60000)
    tracking.resolutionDue = new Date(tracking.resolutionDue.getTime() + pausedMinutes * 60000)
    tracking.pausedAt = null
    await this.slaTrackingRepo.save(tracking)
  }

  async getTracking(ticketId: string): Promise<SLATracking | null> {
    return this.slaTrackingRepo.findOne({ where: { ticketId }, relations: ['slaConfig'] })
  }

  async getAllConfigs() {
    return this.slaConfigRepo.find({
      where: { isActive: true },
      relations: ['department', 'category'],
      order: { priority: 'ASC' }
    })
  }

  async createConfig(data: Partial<SLAConfiguration>): Promise<SLAConfiguration> {
    const config = this.slaConfigRepo.create(data)
    return this.slaConfigRepo.save(config)
  }

  async updateConfig(id: string, data: Partial<SLAConfiguration>): Promise<SLAConfiguration | null> {
    await this.slaConfigRepo.update(id, data)
    return this.slaConfigRepo.findOne({ where: { id } })
  }

  // Finds most specific SLA config: department+category > department > priority
  private async findConfig(priority: Priority, departmentId?: string, categoryId?: string): Promise<SLAConfiguration | null> {
    if (departmentId && categoryId) {
      const specific = await this.slaConfigRepo.findOne({
        where: { priority, departmentId, categoryId, isActive: true }
      })
      if (specific) return specific
    }

    if (departmentId) {
      const deptLevel = await this.slaConfigRepo.findOne({
        where: { priority, departmentId, isActive: true }
      })
      if (deptLevel) return deptLevel
    }

    return this.slaConfigRepo.findOne({
      where: { priority, departmentId: undefined, categoryId: undefined, isActive: true }
    })
  }

  // Called by cron job to check all active tickets
  async runBreachCheck(fastify: FastifyInstance): Promise<void> {
    const activeTracking = await this.slaTrackingRepo
      .createQueryBuilder('st')
      .leftJoinAndSelect('st.ticket', 'ticket')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .leftJoinAndSelect('ticket.department', 'department')
      .where('st.resolution_met IS NULL')
      .andWhere('ticket.deleted_at IS NULL')
      .getMany()

    const notifService = new NotificationService(this.slaTrackingRepo.manager.connection, fastify)
    const now = new Date()

    for (const tracking of activeTracking) {
      const remaining = tracking.resolutionDue.getTime() - now.getTime()
      const config = await this.slaConfigRepo.findOne({ where: { id: tracking.slaConfigId } })
      if (!config) continue

      const totalMs = config.resolutionMinutes * 60000
      const elapsed = totalMs - remaining
      const pct = totalMs > 0 ? elapsed / totalMs : 0

      if (now > tracking.resolutionDue && tracking.status !== SLAStatus.Breached) {
        tracking.status = SLAStatus.Breached
        await this.slaTrackingRepo.save(tracking)

        // Notify assignee and department
        if (tracking.ticket.assignedToId) {
          await notifService.create({
            userId: tracking.ticket.assignedToId,
            ticketId: tracking.ticketId,
            type: NotificationType.SLABreached,
            title: 'SLA Breached',
            body: `Ticket ${tracking.ticket.ticketNumber} has breached its SLA deadline.`,
          })
        }
      } else if (pct > 0.8 && tracking.status === SLAStatus.OnTrack) {
        tracking.status = SLAStatus.AtRisk
        await this.slaTrackingRepo.save(tracking)

        if (tracking.ticket.assignedToId) {
          await notifService.create({
            userId: tracking.ticket.assignedToId,
            ticketId: tracking.ticketId,
            type: NotificationType.SLAAtRisk,
            title: 'SLA At Risk',
            body: `Ticket ${tracking.ticket.ticketNumber} is approaching its SLA deadline.`,
          })
        }
      }
    }
  }
}
