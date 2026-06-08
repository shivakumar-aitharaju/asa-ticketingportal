import { DataSource, Repository } from 'typeorm'
import { Department } from '../entities/department.entity'
import { CategoryDepartmentMapping } from '../entities/category-department-mapping.entity'
import { CategoryMember } from '../entities/category-member.entity'
import { User } from '../entities/user.entity'
import { ConflictError, NotFoundError } from '../utils/errors'
import { CreateDepartmentBody, UpdateDepartmentBody } from '../schemas/department.schema'

export class DepartmentService {
  private repo: Repository<Department>
  private mappingRepo: Repository<CategoryDepartmentMapping>
  private dataSource: DataSource

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource
    this.repo = dataSource.getRepository(Department)
    this.mappingRepo = dataSource.getRepository(CategoryDepartmentMapping)
  }

  async findAll() {
    return this.repo.find({ where: { deletedAt: undefined }, order: { name: 'ASC' } })
  }

  async findById(id: string): Promise<Department> {
    const dept = await this.repo.findOne({ where: { id } })
    if (!dept) throw new NotFoundError('Department not found')
    return dept
  }

  async create(data: CreateDepartmentBody): Promise<Department> {
    const existing = await this.repo.findOne({ where: { name: data.name } })
    if (existing) throw new ConflictError('Department with this name already exists')

    const dept = this.repo.create(data)
    return this.repo.save(dept)
  }

  async update(id: string, data: UpdateDepartmentBody): Promise<Department> {
    const dept = await this.findById(id)
    Object.assign(dept, data)
    return this.repo.save(dept)
  }

  async softDelete(id: string): Promise<void> {
    const dept = await this.findById(id)
    await this.repo.softRemove(dept)
  }

  async mapCategory(departmentId: string, categoryId: string): Promise<void> {
    await this.findById(departmentId)

    const existing = await this.mappingRepo.findOne({ where: { departmentId, categoryId } })
    if (existing) throw new ConflictError('This category is already mapped to this department')

    const mapping = this.mappingRepo.create({ departmentId, categoryId })
    await this.mappingRepo.save(mapping)
  }

  async unmapCategory(departmentId: string, categoryId: string): Promise<void> {
    await this.mappingRepo.delete({ departmentId, categoryId })
  }

  async getCategories(departmentId: string) {
    return this.mappingRepo.find({
      where: { departmentId },
      relations: ['category'],
    })
  }

  // Find department for a category (used in auto-routing)
  async getDepartmentForCategory(categoryId: string): Promise<Department | null> {
    const mapping = await this.mappingRepo.findOne({
      where: { categoryId },
      relations: ['department'],
    })
    return mapping?.department ?? null
  }

  async addMember(departmentId: string, userId: string): Promise<void> {
    const existing = await this.dataSource.query(
      `SELECT id FROM category_members WHERE user_id = $1 AND category_id = $2`,
      [userId, departmentId]
    )
    if (existing.length > 0) {
      throw new ConflictError('User is already a member of this category')
    }

    await this.dataSource.query(
      `INSERT INTO category_members (user_id, category_id) VALUES ($1, $2)`,
      [userId, departmentId]
    )
  }

  async removeMember(departmentId: string, userId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM category_members WHERE user_id = $1 AND category_id = $2`,
      [userId, departmentId]
    )
  }

  async getMembers(
    departmentId: string
  ): Promise<Array<{ userId: string; user: User; createdAt: Date }>> {
    const rows = await this.dataSource.query(
      `
      SELECT
        cm.user_id,
        cm.created_at,
        u.id AS u_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.department_id,
        u.is_active,
        u.avatar_url
      FROM category_members cm
      INNER JOIN users u ON u.id = cm.user_id
      WHERE cm.category_id = $1
        AND u.deleted_at IS NULL
      ORDER BY cm.created_at ASC
      `,
      [departmentId]
    )

    return rows.map((r: any) => {
      const user = new User()
      user.id = r.u_id
      user.email = r.email
      user.firstName = r.first_name
      user.lastName = r.last_name
      user.phone = r.phone
      user.role = r.role
      user.departmentId = r.department_id
      user.isActive = r.is_active
      user.avatarUrl = r.avatar_url
      return {
        userId: r.user_id as string,
        user,
        createdAt: r.created_at as Date,
      }
    })
  }

  async getUserCategories(userId: string): Promise<string[]> {
    const rows = await this.dataSource.query(
      `SELECT category_id FROM category_members WHERE user_id = $1`,
      [userId]
    )
    return rows.map((r: any) => r.category_id as string)
  }
}
