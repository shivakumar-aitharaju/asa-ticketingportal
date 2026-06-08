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
exports.Escalation = exports.EscalationStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const ticket_entity_1 = require("./ticket.entity");
const user_entity_1 = require("./user.entity");
var EscalationStatus;
(function (EscalationStatus) {
    EscalationStatus["Active"] = "active";
    EscalationStatus["Resolved"] = "resolved";
    EscalationStatus["Closed"] = "closed";
})(EscalationStatus || (exports.EscalationStatus = EscalationStatus = {}));
let Escalation = class Escalation extends base_entity_1.BaseEntity {
    ticketId;
    ticket;
    escalatedById;
    escalatedBy;
    escalatedToId;
    reason;
    level;
    status;
    resolvedAt;
    resolvedById;
    resolutionNote;
};
exports.Escalation = Escalation;
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id' }),
    __metadata("design:type", String)
], Escalation.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], Escalation.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'escalated_by_id' }),
    __metadata("design:type", String)
], Escalation.prototype, "escalatedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'escalated_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Escalation.prototype, "escalatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'escalated_to_id' }),
    __metadata("design:type", String)
], Escalation.prototype, "escalatedToId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Escalation.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Escalation.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EscalationStatus, default: EscalationStatus.Active }),
    __metadata("design:type", String)
], Escalation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'resolved_at' }),
    __metadata("design:type", Date)
], Escalation.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'resolved_by_id' }),
    __metadata("design:type", String)
], Escalation.prototype, "resolvedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'resolution_note' }),
    __metadata("design:type", String)
], Escalation.prototype, "resolutionNote", void 0);
exports.Escalation = Escalation = __decorate([
    (0, typeorm_1.Entity)('escalations'),
    (0, typeorm_1.Index)(['ticketId']),
    (0, typeorm_1.Index)(['status'])
], Escalation);
//# sourceMappingURL=escalation.entity.js.map