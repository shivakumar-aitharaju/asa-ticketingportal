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
exports.TicketStatusHistory = void 0;
const typeorm_1 = require("typeorm");
const ticket_status_enum_1 = require("../types/ticket-status.enum");
const ticket_entity_1 = require("./ticket.entity");
const user_entity_1 = require("./user.entity");
let TicketStatusHistory = class TicketStatusHistory {
    id;
    ticketId;
    ticket;
    fromStatus;
    toStatus;
    changedById;
    changedBy;
    reason;
    createdAt;
};
exports.TicketStatusHistory = TicketStatusHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id' }),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], TicketStatusHistory.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ticket_status_enum_1.TicketStatus, nullable: true, name: 'from_status' }),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ticket_status_enum_1.TicketStatus, name: 'to_status' }),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changed_by_id' }),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "changedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'changed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], TicketStatusHistory.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TicketStatusHistory.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' }),
    __metadata("design:type", Date)
], TicketStatusHistory.prototype, "createdAt", void 0);
exports.TicketStatusHistory = TicketStatusHistory = __decorate([
    (0, typeorm_1.Entity)('ticket_status_history'),
    (0, typeorm_1.Index)(['ticketId'])
], TicketStatusHistory);
//# sourceMappingURL=ticket-status-history.entity.js.map