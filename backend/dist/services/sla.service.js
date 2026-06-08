"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAService = void 0;
const sla_configuration_entity_1 = require("../entities/sla-configuration.entity");
const sla_tracking_entity_1 = require("../entities/sla-tracking.entity");
const ticket_entity_1 = require("../entities/ticket.entity");
const business_hours_1 = require("../utils/business-hours");
const notification_service_1 = require("./notification.service");
const notification_entity_1 = require("../entities/notification.entity");
class SLAService {
    slaConfigRepo;
    slaTrackingRepo;
    ticketRepo;
    constructor(dataSource) {
        this.slaConfigRepo = dataSource.getRepository(sla_configuration_entity_1.SLAConfiguration);
        this.slaTrackingRepo = dataSource.getRepository(sla_tracking_entity_1.SLATracking);
        this.ticketRepo = dataSource.getRepository(ticket_entity_1.Ticket);
    }
    async startTracking(ticket) {
        const config = await this.findConfig(ticket.priority, ticket.departmentId, ticket.categoryId);
        if (!config) {
            throw new Error(`No SLA config found for priority ${ticket.priority}`);
        }
        const now = new Date();
        const firstResponseDue = (0, business_hours_1.addBusinessMinutes)(now, config.firstResponseMinutes);
        const resolutionDue = (0, business_hours_1.addBusinessMinutes)(now, config.resolutionMinutes);
        const tracking = this.slaTrackingRepo.create({
            ticketId: ticket.id,
            slaConfigId: config.id,
            firstResponseDue,
            resolutionDue,
            status: sla_tracking_entity_1.SLAStatus.OnTrack,
        });
        return this.slaTrackingRepo.save(tracking);
    }
    async updateStatus(ticketId) {
        const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } });
        if (!tracking || tracking.resolutionMet !== null)
            return tracking;
        const now = new Date();
        const totalMs = tracking.resolutionDue.getTime() - tracking.ticketId.length;
        const elapsed = now.getTime() - (tracking.resolutionDue.getTime() -
            (await this.slaConfigRepo.findOne({ where: { id: tracking.slaConfigId } })).resolutionMinutes * 60000);
        const remaining = tracking.resolutionDue.getTime() - now.getTime();
        const totalDuration = tracking.resolutionDue.getTime() -
            (now.getTime() - elapsed);
        const pct = elapsed / totalDuration;
        let newStatus = sla_tracking_entity_1.SLAStatus.OnTrack;
        if (now > tracking.resolutionDue) {
            newStatus = sla_tracking_entity_1.SLAStatus.Breached;
        }
        else if (pct > 0.8) {
            newStatus = sla_tracking_entity_1.SLAStatus.AtRisk;
        }
        if (tracking.status !== newStatus) {
            tracking.status = newStatus;
            await this.slaTrackingRepo.save(tracking);
        }
        return tracking;
    }
    async markFirstResponse(ticketId) {
        const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } });
        if (!tracking || tracking.firstResponseMet !== null)
            return;
        const now = new Date();
        tracking.firstResponseAt = now;
        tracking.firstResponseMet = now <= tracking.firstResponseDue;
        await this.slaTrackingRepo.save(tracking);
    }
    async markResolved(ticketId) {
        const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } });
        if (!tracking)
            return;
        const now = new Date();
        tracking.resolvedAt = now;
        tracking.resolutionMet = now <= tracking.resolutionDue;
        tracking.status = tracking.resolutionMet ? sla_tracking_entity_1.SLAStatus.Met : sla_tracking_entity_1.SLAStatus.Breached;
        await this.slaTrackingRepo.save(tracking);
    }
    async pauseTimer(ticketId) {
        const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } });
        if (!tracking || tracking.pausedAt)
            return;
        tracking.pausedAt = new Date();
        await this.slaTrackingRepo.save(tracking);
    }
    async resumeTimer(ticketId) {
        const tracking = await this.slaTrackingRepo.findOne({ where: { ticketId } });
        if (!tracking || !tracking.pausedAt)
            return;
        const pausedMinutes = Math.floor((new Date().getTime() - tracking.pausedAt.getTime()) / 60000);
        tracking.totalPausedMinutes += pausedMinutes;
        tracking.firstResponseDue = new Date(tracking.firstResponseDue.getTime() + pausedMinutes * 60000);
        tracking.resolutionDue = new Date(tracking.resolutionDue.getTime() + pausedMinutes * 60000);
        tracking.pausedAt = null;
        await this.slaTrackingRepo.save(tracking);
    }
    async getTracking(ticketId) {
        return this.slaTrackingRepo.findOne({ where: { ticketId }, relations: ['slaConfig'] });
    }
    async getAllConfigs() {
        return this.slaConfigRepo.find({
            where: { isActive: true },
            relations: ['department', 'category'],
            order: { priority: 'ASC' }
        });
    }
    async createConfig(data) {
        const config = this.slaConfigRepo.create(data);
        return this.slaConfigRepo.save(config);
    }
    async updateConfig(id, data) {
        await this.slaConfigRepo.update(id, data);
        return this.slaConfigRepo.findOne({ where: { id } });
    }
    async findConfig(priority, departmentId, categoryId) {
        if (departmentId && categoryId) {
            const specific = await this.slaConfigRepo.findOne({
                where: { priority, departmentId, categoryId, isActive: true }
            });
            if (specific)
                return specific;
        }
        if (departmentId) {
            const deptLevel = await this.slaConfigRepo.findOne({
                where: { priority, departmentId, isActive: true }
            });
            if (deptLevel)
                return deptLevel;
        }
        return this.slaConfigRepo.findOne({
            where: { priority, departmentId: undefined, categoryId: undefined, isActive: true }
        });
    }
    async runBreachCheck(fastify) {
        const activeTracking = await this.slaTrackingRepo
            .createQueryBuilder('st')
            .leftJoinAndSelect('st.ticket', 'ticket')
            .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
            .leftJoinAndSelect('ticket.department', 'department')
            .where('st.resolution_met IS NULL')
            .andWhere('ticket.deleted_at IS NULL')
            .getMany();
        const notifService = new notification_service_1.NotificationService(this.slaTrackingRepo.manager.connection, fastify);
        const now = new Date();
        for (const tracking of activeTracking) {
            const remaining = tracking.resolutionDue.getTime() - now.getTime();
            const config = await this.slaConfigRepo.findOne({ where: { id: tracking.slaConfigId } });
            if (!config)
                continue;
            const totalMs = config.resolutionMinutes * 60000;
            const elapsed = totalMs - remaining;
            const pct = totalMs > 0 ? elapsed / totalMs : 0;
            if (now > tracking.resolutionDue && tracking.status !== sla_tracking_entity_1.SLAStatus.Breached) {
                tracking.status = sla_tracking_entity_1.SLAStatus.Breached;
                await this.slaTrackingRepo.save(tracking);
                if (tracking.ticket.assignedToId) {
                    await notifService.create({
                        userId: tracking.ticket.assignedToId,
                        ticketId: tracking.ticketId,
                        type: notification_entity_1.NotificationType.SLABreached,
                        title: 'SLA Breached',
                        body: `Ticket ${tracking.ticket.ticketNumber} has breached its SLA deadline.`,
                    });
                }
            }
            else if (pct > 0.8 && tracking.status === sla_tracking_entity_1.SLAStatus.OnTrack) {
                tracking.status = sla_tracking_entity_1.SLAStatus.AtRisk;
                await this.slaTrackingRepo.save(tracking);
                if (tracking.ticket.assignedToId) {
                    await notifService.create({
                        userId: tracking.ticket.assignedToId,
                        ticketId: tracking.ticketId,
                        type: notification_entity_1.NotificationType.SLAAtRisk,
                        title: 'SLA At Risk',
                        body: `Ticket ${tracking.ticket.ticketNumber} is approaching its SLA deadline.`,
                    });
                }
            }
        }
    }
}
exports.SLAService = SLAService;
//# sourceMappingURL=sla.service.js.map