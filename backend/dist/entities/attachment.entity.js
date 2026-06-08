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
exports.Attachment = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const ticket_entity_1 = require("./ticket.entity");
const user_entity_1 = require("./user.entity");
let Attachment = class Attachment extends base_entity_1.BaseEntity {
    ticketId;
    ticket;
    messageId;
    uploadedById;
    uploadedBy;
    fileName;
    fileType;
    fileSize;
    s3Key;
    s3Bucket;
};
exports.Attachment = Attachment;
__decorate([
    (0, typeorm_1.Column)({ name: 'ticket_id' }),
    __metadata("design:type", String)
], Attachment.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticket_entity_1.Ticket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", ticket_entity_1.Ticket)
], Attachment.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'message_id' }),
    __metadata("design:type", String)
], Attachment.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id' }),
    __metadata("design:type", String)
], Attachment.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Attachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'file_name' }),
    __metadata("design:type", String)
], Attachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'file_type' }),
    __metadata("design:type", String)
], Attachment.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'file_size' }),
    __metadata("design:type", Number)
], Attachment.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1024, name: 's3_key' }),
    __metadata("design:type", String)
], Attachment.prototype, "s3Key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 's3_bucket' }),
    __metadata("design:type", String)
], Attachment.prototype, "s3Bucket", void 0);
exports.Attachment = Attachment = __decorate([
    (0, typeorm_1.Entity)('attachments'),
    (0, typeorm_1.Index)(['ticketId'])
], Attachment);
//# sourceMappingURL=attachment.entity.js.map