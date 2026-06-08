"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryDepartmentMapping = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const department_entity_1 = require("./department.entity");
let CategoryDepartmentMapping = class CategoryDepartmentMapping {
    id;
    categoryId;
    category;
    departmentId;
    department;
    createdAt;
};
exports.CategoryDepartmentMapping = CategoryDepartmentMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CategoryDepartmentMapping.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", String)
], CategoryDepartmentMapping.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], CategoryDepartmentMapping.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id' }),
    __metadata("design:type", String)
], CategoryDepartmentMapping.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], CategoryDepartmentMapping.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' }),
    __metadata("design:type", Date)
], CategoryDepartmentMapping.prototype, "createdAt", void 0);
exports.CategoryDepartmentMapping = CategoryDepartmentMapping = __decorate([
    (0, typeorm_1.Entity)('category_department_mappings'),
    (0, typeorm_1.Index)(['categoryId', 'departmentId'], { unique: true })
], CategoryDepartmentMapping);
//# sourceMappingURL=category-department-mapping.entity.js.map