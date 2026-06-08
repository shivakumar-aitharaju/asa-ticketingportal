"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const department_entity_1 = require("../entities/department.entity");
const category_department_mapping_entity_1 = require("../entities/category-department-mapping.entity");
const user_entity_1 = require("../entities/user.entity");
const errors_1 = require("../utils/errors");
class DepartmentService {
    repo;
    mappingRepo;
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.repo = dataSource.getRepository(department_entity_1.Department);
        this.mappingRepo = dataSource.getRepository(category_department_mapping_entity_1.CategoryDepartmentMapping);
    }
    async findAll() {
        return this.repo.find({ where: { deletedAt: undefined }, order: { name: 'ASC' } });
    }
    async findById(id) {
        const dept = await this.repo.findOne({ where: { id } });
        if (!dept)
            throw new errors_1.NotFoundError('Department not found');
        return dept;
    }
    async create(data) {
        const existing = await this.repo.findOne({ where: { name: data.name } });
        if (existing)
            throw new errors_1.ConflictError('Department with this name already exists');
        const dept = this.repo.create(data);
        return this.repo.save(dept);
    }
    async update(id, data) {
        const dept = await this.findById(id);
        Object.assign(dept, data);
        return this.repo.save(dept);
    }
    async softDelete(id) {
        const dept = await this.findById(id);
        await this.repo.softRemove(dept);
    }
    async mapCategory(departmentId, categoryId) {
        await this.findById(departmentId);
        const existing = await this.mappingRepo.findOne({ where: { departmentId, categoryId } });
        if (existing)
            throw new errors_1.ConflictError('This category is already mapped to this department');
        const mapping = this.mappingRepo.create({ departmentId, categoryId });
        await this.mappingRepo.save(mapping);
    }
    async unmapCategory(departmentId, categoryId) {
        await this.mappingRepo.delete({ departmentId, categoryId });
    }
    async getCategories(departmentId) {
        return this.mappingRepo.find({
            where: { departmentId },
            relations: ['category'],
        });
    }
    async getDepartmentForCategory(categoryId) {
        const mapping = await this.mappingRepo.findOne({
            where: { categoryId },
            relations: ['department'],
        });
        return mapping?.department ?? null;
    }
    async addMember(departmentId, userId) {
        const existing = await this.dataSource.query(`SELECT id FROM category_members WHERE user_id = $1 AND category_id = $2`, [userId, departmentId]);
        if (existing.length > 0) {
            throw new errors_1.ConflictError('User is already a member of this category');
        }
        await this.dataSource.query(`INSERT INTO category_members (user_id, category_id) VALUES ($1, $2)`, [userId, departmentId]);
    }
    async removeMember(departmentId, userId) {
        await this.dataSource.query(`DELETE FROM category_members WHERE user_id = $1 AND category_id = $2`, [userId, departmentId]);
    }
    async getMembers(departmentId) {
        const rows = await this.dataSource.query(`
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
      `, [departmentId]);
        return rows.map((r) => {
            const user = new user_entity_1.User();
            user.id = r.u_id;
            user.email = r.email;
            user.firstName = r.first_name;
            user.lastName = r.last_name;
            user.phone = r.phone;
            user.role = r.role;
            user.departmentId = r.department_id;
            user.isActive = r.is_active;
            user.avatarUrl = r.avatar_url;
            return {
                userId: r.user_id,
                user,
                createdAt: r.created_at,
            };
        });
    }
    async getUserCategories(userId) {
        const rows = await this.dataSource.query(`SELECT category_id FROM category_members WHERE user_id = $1`, [userId]);
        return rows.map((r) => r.category_id);
    }
}
exports.DepartmentService = DepartmentService;
//# sourceMappingURL=department.service.js.map