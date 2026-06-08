import { DataSource, Repository } from 'typeorm'
import { AuditLog } from '../entities/audit-log.entity'

interface AuditLogInput {
  actorId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  oldValue?: Record<string, any> | null
  newValue?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any> | null
}

export class AuditService {
  private repo: Repository<AuditLog>

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AuditLog)
  }

  async log(input: AuditLogInput): Promise<void> {
    const entry = this.repo.create(input)
    await this.repo.save(entry).catch(() => {
      // Audit log failures must never break the main operation
    })
  }

  async getAll(page = 1, limit = 50, resource?: string, action?: string) {
    const qb = this.repo.createQueryBuilder('al')
      .leftJoinAndSelect('al.actor', 'actor')
      .orderBy('al.createdAt', 'DESC')

    if (resource) qb.andWhere('al.resource = :resource', { resource })
    if (action) qb.andWhere('al.action = :action', { action })

    const total = await qb.getCount()
    const data = await qb.skip((page - 1) * limit).take(limit).getMany()

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getForResource(resource: string, resourceId: string) {
    return this.repo.find({
      where: { resource, resourceId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: 100
    })
  }
}
