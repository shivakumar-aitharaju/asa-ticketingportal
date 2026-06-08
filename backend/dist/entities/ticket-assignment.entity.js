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
exports.TicketAssignment = void 0;
const typeorm_1 = require("typeorm");
const ticket_entity_1 = require("./ticket.entity");
const user_entity_1 = require("./user.entity");
let TicketAssignment = class TicketAssignment {
    id;
    ticketId;
    ticket;
    assignedToId;
    assignedTo;
    assignedById;
    assignedBy;
    unassignedAt;
    reason;
    createdAt;
};
exports.TicketAssignment = TicketAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TicketAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id' }),
    __metadata("design:type", String)
], TicketAssignment.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], TicketAssignment.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_id' }),
    __metadata("design:type", String)
], TicketAssignment.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], TicketAssignment.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_by_id' }),
    __metadata("design:type", String)
], TicketAssignment.prototype, "assignedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_by_id' }),
    __metadata("design:type", user_entity_1.User)
], TicketAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'unassigned_at' }),
    __metadata("design:type", Date)
], TicketAssignment.prototype, "unassignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TicketAssignment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' }),
    __metadata("design:type", Date)
], TicketAssignment.prototype, "createdAt", void 0);
exports.TicketAssignment = TicketAssignment = __decorate([
    (0, typeorm_1.Entity)('ticket_assignments'),
    (0, typeorm_1.Index)(['ticketId']),
    (0, typeorm_1.Index)(['assignedToId'])
], TicketAssignment);
//# sourceMappingURL=ticket-assignment.entity.js.map