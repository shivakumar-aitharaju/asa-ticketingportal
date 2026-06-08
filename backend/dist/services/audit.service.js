"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_log_entity_1 = require("../entities/audit-log.entity");
class AuditService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(audit_log_entity_1.AuditLog);
    }
    async log(input) {
        const entry = this.repo.create(input);
        await this.repo.save(entry).catch(() => {
        });
    }
    async getAll(page = 1, limit = 50, resource, action) {
        const qb = this.repo.createQueryBuilder('al')
            .leftJoinAndSelect('al.actor', 'actor')
            .orderBy('al.createdAt', 'DESC');
        if (resource)
            qb.andWhere('al.resource = :resource', { resource });
        if (action)
            qb.andWhere('al.action = :action', { action });
        const total = await qb.getCount();
        const data = await qb.skip((page - 1) * limit).take(limit).getMany();
        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getForResource(resource, resourceId) {
        return this.repo.find({
            where: { resource, resourceId },
            relations: ['actor'],
            order: { createdAt: 'DESC' },
            take: 100
        });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map