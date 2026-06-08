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
exports.Ticket = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const ticket_status_enum_1 = require("../types/ticket-status.enum");
const priority_enum_1 = require("../types/priority.enum");
const user_entity_1 = require("./user.entity");
const category_entity_1 = require("./category.entity");
const department_entity_1 = require("./department.entity");
let Ticket = class Ticket extends base_entity_1.BaseEntity {
    ticketNumber;
    subject;
    description;
    status;
    priority;
    isEscalated;
    categoryId;
    category;
    departmentId;
    department;
    createdById;
    createdBy;
    assignedToId;
    assignedTo;
    resolutionSummary;
    resolvedAt;
    closedAt;
    firstResponseAt;
    tags;
    clientRating;
    clientRatedAt;
};
exports.Ticket = Ticket;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, name: 'ticket_number' }),
    __metadata("design:type", String)
], Ticket.prototype, "ticketNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Ticket.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Ticket.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ticket_status_enum_1.TicketStatus, default: ticket_status_enum_1.TicketStatus.Open }),
    __metadata("design:type", String)
], Ticket.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: priority_enum_1.Priority, default: priority_enum_1.Priority.Medium }),
    __metadata("design:type", String)
], Ticket.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_escalated' }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "isEscalated", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", String)
], Ticket.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Ticket.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id' }),
    __metadata("design:type", String)
], Ticket.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Ticket.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], Ticket.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Ticket.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'assigned_to_id' }),
    __metadata("design:type", String)
], Ticket.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], Ticket.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'resolution_summary' }),
    __metadata("design:type", String)
], Ticket.prototype, "resolutionSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'resolved_at' }),
    __metadata("design:type", Date)
], Ticket.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'closed_at' }),
    __metadata("design:type", Date)
], Ticket.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'first_response_at' }),
    __metadata("design:type", Date)
], Ticket.prototype, "firstResponseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '', nullable: true }),
    __metadata("design:type", Array)
], Ticket.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true, name: 'client_rating' }),
    __metadata("design:type", String)
], Ticket.prototype, "clientRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'client_rated_at' }),
    __metadata("design:type", Date)
], Ticket.prototype, "clientRatedAt", void 0);
exports.Ticket = Ticket = __decorate([
    (0, typeorm_1.Entity)('tickets'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['priority']),
    (0, typeorm_1.Index)(['departmentId']),
    (0, typeorm_1.Index)(['assignedToId']),
    (0, typeorm_1.Index)(['createdById']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Index)(['isEscalated'])
], Ticket);
//# sourceMappingURL=ticket.entity.js.map