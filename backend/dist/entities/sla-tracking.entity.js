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
exports.SLATracking = exports.SLAStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const ticket_entity_1 = require("./ticket.entity");
const sla_configuration_entity_1 = require("./sla-configuration.entity");
var SLAStatus;
(function (SLAStatus) {
    SLAStatus["OnTrack"] = "on_track";
    SLAStatus["AtRisk"] = "at_risk";
    SLAStatus["Breached"] = "breached";
    SLAStatus["Met"] = "met";
})(SLAStatus || (exports.SLAStatus = SLAStatus = {}));
let SLATracking = class SLATracking extends base_entity_1.BaseEntity {
    ticketId;
    ticket;
    slaConfigId;
    slaConfig;
    firstResponseDue;
    resolutionDue;
    firstResponseMet;
    firstResponseAt;
    resolutionMet;
    resolvedAt;
    status;
    pausedAt;
    totalPausedMinutes;
    breachNotifiedAt;
};
exports.SLATracking = SLATracking;
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id', unique: true }),
    __metadata("design:type", String)
], SLATracking.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], SLATracking.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sla_config_id' }),
    __metadata("design:type", String)
], SLATracking.prototype, "slaConfigId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sla_configuration_entity_1.SLAConfiguration, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sla_config_id' }),
    __metadata("design:type", sla_configuration_entity_1.SLAConfiguration)
], SLATracking.prototype, "slaConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'first_response_due' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "firstResponseDue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'resolution_due' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "resolutionDue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, name: 'first_response_met' }),
    __metadata("design:type", Boolean)
], SLATracking.prototype, "firstResponseMet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'first_response_at' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "firstResponseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, name: 'resolution_met' }),
    __metadata("design:type", Boolean)
], SLATracking.prototype, "resolutionMet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'resolved_at' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SLAStatus, default: SLAStatus.OnTrack }),
    __metadata("design:type", String)
], SLATracking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'paused_at' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "pausedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'total_paused_minutes' }),
    __metadata("design:type", Number)
], SLATracking.prototype, "totalPausedMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'breach_notified_at' }),
    __metadata("design:type", Date)
], SLATracking.prototype, "breachNotifiedAt", void 0);
exports.SLATracking = SLATracking = __decorate([
    (0, typeorm_1.Entity)('sla_tracking'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['resolutionDue'])
], SLATracking);
//# sourceMappingURL=sla-tracking.entity.js.map