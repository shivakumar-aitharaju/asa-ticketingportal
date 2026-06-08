import { DataSource, Repository } from 'typeorm'
import { Category } from '../entities/category.entity'
import { ConflictError, NotFoundError } from '../utils/errors'
import { CreateCategoryBody, UpdateCategoryBody } from '../schemas/category.schema'

export class CategoryService {
  private repo: Repository<Category>

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Category)
  }

  async findAll(includeInactive = false) {
    const where: any = {}
    if (!includeInactive) where.isActive = true
    return this.repo.find({ where, order: { name: 'ASC' } })
  }

  async findById(id: string): Promise<Category> {
    const cat = await this.repo.findOne({ where: { id } })
    if (!cat) throw new NotFoundError('Category not found')
    return cat
  }

  async create(data: CreateCategoryBody): Promise<Category> {
    const existing = await this.repo.findOne({ where: { name: data.name } })
    if (existing) throw new ConflictError('Category with this name already exists')

    const cat = this.repo.create(data)
    return this.repo.save(cat)
  }

  async update(id: string, data: UpdateCategoryBody): Promise<Category> {
    const cat = await this.findById(id)
    Object.assign(cat, data)
    return this.repo.save(cat)
  }

  async delete(id: string): Promise<void> {
    const cat = await this.findById(id)
    await this.repo.softRemove(cat)
  }
}
