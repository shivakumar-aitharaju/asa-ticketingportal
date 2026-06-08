"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const user_role_enum_1 = require("../types/user-role.enum");
const errors_1 = require("../utils/errors");
class UserService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(user_entity_1.User);
    }
    async create(data) {
        const existing = await this.repo.findOne({ where: { email: data.email.toLowerCase() } });
        if (existing)
            throw new errors_1.ConflictError('A user with this email already exists');
        const user = this.repo.create({
            ...data,
            email: data.email.toLowerCase(),
            password: await bcrypt_1.default.hash(data.password, 12),
        });
        return this.repo.save(user);
    }
    async findAll(page = 1, limit = 25, search, role, departmentId) {
        const qb = this.repo.createQueryBuilder('u')
            .leftJoinAndSelect('u.department', 'department')
            .where('u.deleted_at IS NULL');
        if (search) {
            qb.andWhere('(u.email ILIKE :s OR u.first_name ILIKE :s OR u.last_name ILIKE :s)', { s: `%${search}%` });
        }
        if (role)
            qb.andWhere('u.role = :role', { role });
        if (departmentId)
            qb.andWhere('u.department_id = :departmentId', { departmentId });
        const total = await qb.getCount();
        const data = await qb.orderBy('u.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getMany();
        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findById(id) {
        const user = await this.repo.findOne({ where: { id }, relations: ['department'] });
        if (!user)
            throw new errors_1.NotFoundError('User not found');
        return user;
    }
    async update(id, data) {
        const user = await this.findById(id);
        Object.assign(user, data);
        return this.repo.save(user);
    }
    async updateProfile(id, data) {
        const user = await this.findById(id);
        Object.assign(user, data);
        return this.repo.save(user);
    }
    async resetPassword(id, newPassword) {
        const user = await this.findById(id);
        user.password = await bcrypt_1.default.hash(newPassword, 12);
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.repo.save(user);
    }
    async deactivate(id) {
        const user = await this.findById(id);
        user.isActive = false;
        await this.repo.save(user);
    }
    async getAgentsByDepartment(departmentId) {
        return this.repo.find({
            where: { departmentId, role: user_role_enum_1.UserRole.Agent, isActive: true },
            order: { firstName: 'ASC' }
        });
    }
    async getWorkload(departmentId) {
        return this.repo.createQueryBuilder('u')
            .leftJoin('tickets', 't', 't.assigned_to_id = u.id AND t.status NOT IN (\'resolved\',\'closed\') AND t.deleted_at IS NULL')
            .select(['u.id', 'u.first_name', 'u.last_name', 'u.email'])
            .addSelect('COUNT(t.id)', 'assignedCount')
            .where('u.department_id = :departmentId', { departmentId })
            .andWhere('u.role = :role', { role: user_role_enum_1.UserRole.Agent })
            .andWhere('u.is_active = true')
            .groupBy('u.id')
            .getRawMany();
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map