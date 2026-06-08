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
exports.TicketMessage = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const ticket_entity_1 = require("./ticket.entity");
const user_entity_1 = require("./user.entity");
let TicketMessage = class TicketMessage extends base_entity_1.BaseEntity {
    ticketId;
    ticket;
    authorId;
    author;
    content;
    isClientFacing;
    editedAt;
};
exports.TicketMessage = TicketMessage;
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], TicketMessage.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", user_entity_1.User)
], TicketMessage.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_client_facing' }),
    __metadata("design:type", Boolean)
], TicketMessage.prototype, "isClientFacing", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true, name: 'edited_at' }),
    __metadata("design:type", Date)
], TicketMessage.prototype, "editedAt", void 0);
exports.TicketMessage = TicketMessage = __decorate([
    (0, typeorm_1.Entity)('ticket_messages'),
    (0, typeorm_1.Index)(['ticketId']),
    (0, typeorm_1.Index)(['authorId'])
], TicketMessage);
//# sourceMappingURL=ticket-message.entity.js.map