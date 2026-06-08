import bcrypt from 'bcrypt'
import { DataSource, Repository, ILike } from 'typeorm'
import { User } from '../entities/user.entity'
import { UserRole } from '../types/user-role.enum'
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors'
import { CreateUserBody, UpdateUserBody, UpdateProfileBody } from '../schemas/user.schema'

export class UserService {
  private repo: Repository<User>

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User)
  }

  async create(data: CreateUserBody): Promise<User> {
    const existing = await this.repo.findOne({ where: { email: data.email.toLowerCase() } })
    if (existing) throw new ConflictError('A user with this email already exists')

    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
      password: await bcrypt.hash(data.password, 12),
    })

    return this.repo.save(user)
  }

  async findAll(page = 1, limit = 25, search?: string, role?: UserRole, departmentId?: string) {
    const qb = this.repo.createQueryBuilder('u')
      .leftJoinAndSelect('u.department', 'department')
      .where('u.deleted_at IS NULL')

    if (search) {
      qb.andWhere('(u.email ILIKE :s OR u.first_name ILIKE :s OR u.last_name ILIKE :s)', { s: `%${search}%` })
    }
    if (role) qb.andWhere('u.role = :role', { role })
    if (departmentId) qb.andWhere('u.department_id = :departmentId', { departmentId })

    const total = await qb.getCount()
    const data = await qb.orderBy('u.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getMany()

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id }, relations: ['department'] })
    if (!user) throw new NotFoundError('User not found')
    return user
  }

  async update(id: string, data: UpdateUserBody): Promise<User> {
    const user = await this.findById(id)
    Object.assign(user, data)
    return this.repo.save(user)
  }

  async updateProfile(id: string, data: UpdateProfileBody): Promise<User> {
    const user = await this.findById(id)
    Object.assign(user, data)
    return this.repo.save(user)
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id)
    user.password = await bcrypt.hash(newPassword, 12)
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await this.repo.save(user)
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id)
    user.isActive = false
    await this.repo.save(user)
  }

  async getAgentsByDepartment(departmentId: string): Promise<User[]> {
    return this.repo.find({
      where: { departmentId, role: UserRole.Agent, isActive: true },
      order: { firstName: 'ASC' }
    })
  }

  async getWorkload(departmentId: string) {
    return this.repo.createQueryBuilder('u')
      .leftJoin('tickets', 't', 't.assigned_to_id = u.id AND t.status NOT IN (\'resolved\',\'closed\') AND t.deleted_at IS NULL')
      .select(['u.id', 'u.first_name', 'u.last_name', 'u.email'])
      .addSelect('COUNT(t.id)', 'assignedCount')
      .where('u.department_id = :departmentId', { departmentId })
      .andWhere('u.role = :role', { role: UserRole.Agent })
      .andWhere('u.is_active = true')
      .groupBy('u.id')
      .getRawMany()
  }
}
