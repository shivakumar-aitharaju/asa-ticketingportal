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
exports.SLAConfiguration = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const priority_enum_1 = require("../types/priority.enum");
const department_entity_1 = require("./department.entity");
const category_entity_1 = require("./category.entity");
let SLAConfiguration = class SLAConfiguration extends base_entity_1.BaseEntity {
    name;
    priority;
    departmentId;
    department;
    categoryId;
    category;
    firstResponseMinutes;
    resolutionMinutes;
    businessHoursOnly;
    isActive;
};
exports.SLAConfiguration = SLAConfiguration;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SLAConfiguration.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: priority_enum_1.Priority }),
    __metadata("design:type", String)
], SLAConfiguration.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'department_id' }),
    __metadata("design:type", String)
], SLAConfiguration.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], SLAConfiguration.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'category_id' }),
    __metadata("design:type", String)
], SLAConfiguration.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], SLAConfiguration.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'first_response_minutes' }),
    __metadata("design:type", Number)
], SLAConfiguration.prototype, "firstResponseMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'resolution_minutes' }),
    __metadata("design:type", Number)
], SLAConfiguration.prototype, "resolutionMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'business_hours_only' }),
    __metadata("design:type", Boolean)
], SLAConfiguration.prototype, "businessHoursOnly", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], SLAConfiguration.prototype, "isActive", void 0);
exports.SLAConfiguration = SLAConfiguration = __decorate([
    (0, typeorm_1.Entity)('sla_configurations')
], SLAConfiguration);
//# sourceMappingURL=sla-configuration.entity.js.map