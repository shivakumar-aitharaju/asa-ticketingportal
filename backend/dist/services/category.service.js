"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const category_entity_1 = require("../entities/category.entity");
const errors_1 = require("../utils/errors");
class CategoryService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(category_entity_1.Category);
    }
    async findAll(includeInactive = false) {
        const where = {};
        if (!includeInactive)
            where.isActive = true;
        return this.repo.find({ where, order: { name: 'ASC' } });
    }
    async findById(id) {
        const cat = await this.repo.findOne({ where: { id } });
        if (!cat)
            throw new errors_1.NotFoundError('Category not found');
        return cat;
    }
    async create(data) {
        const existing = await this.repo.findOne({ where: { name: data.name } });
        if (existing)
            throw new errors_1.ConflictError('Category with this name already exists');
        const cat = this.repo.create(data);
        return this.repo.save(cat);
    }
    async update(id, data) {
        const cat = await this.findById(id);
        Object.assign(cat, data);
        return this.repo.save(cat);
    }
    async delete(id) {
        const cat = await this.findById(id);
        await this.repo.softRemove(cat);
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map