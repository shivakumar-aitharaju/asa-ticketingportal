"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
const attachment_entity_1 = require("../entities/attachment.entity");
const errors_1 = require("../utils/errors");
const UPLOADS_DIR = (0, node_path_1.join)(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024;
function ensureUploadsDir() {
    if (!(0, node_fs_1.existsSync)(UPLOADS_DIR))
        (0, node_fs_1.mkdirSync)(UPLOADS_DIR, { recursive: true });
}
function isS3Configured() {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME);
}
class AttachmentService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(attachment_entity_1.Attachment);
    }
    async upload(ticketId, uploadedById, file) {
        const buffer = await file.toBuffer();
        if (buffer.length > MAX_FILE_SIZE) {
            throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`);
        }
        const ext = file.filename.includes('.') ? file.filename.split('.').pop() : '';
        const s3Key = `tickets/${ticketId}/${(0, node_crypto_1.randomUUID)()}${ext ? '.' + ext : ''}`;
        const bucket = process.env.AWS_S3_BUCKET_NAME ?? 'local';
        if (isS3Configured()) {
            const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
            const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' });
            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: s3Key,
                Body: buffer,
                ContentType: file.mimetype,
            }));
        }
        else {
            ensureUploadsDir();
            const localPath = (0, node_path_1.join)(UPLOADS_DIR, s3Key.replace(/\//g, '_'));
            (0, node_fs_1.writeFileSync)(localPath, buffer);
        }
        const attachment = this.repo.create({
            ticketId,
            uploadedById,
            fileName: file.filename,
            fileType: file.mimetype,
            fileSize: buffer.length,
            s3Key,
            s3Bucket: bucket,
        });
        return this.repo.save(attachment);
    }
    async listForTicket(ticketId) {
        return this.repo.find({
            where: { ticketId },
            relations: ['uploadedBy'],
            order: { createdAt: 'ASC' },
        });
    }
    async getDownloadUrl(attachmentId, requesterId) {
        const att = await this.repo.findOne({ where: { id: attachmentId } });
        if (!att)
            throw new errors_1.NotFoundError('Attachment not found');
        if (isS3Configured()) {
            const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
            const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' });
            return getSignedUrl(s3, new GetObjectCommand({ Bucket: att.s3Bucket, Key: att.s3Key }), { expiresIn: 3600 });
        }
        return `/api/attachments/${att.id}/file`;
    }
    async serveLocalFile(attachmentId) {
        const att = await this.repo.findOne({ where: { id: attachmentId } });
        if (!att)
            throw new errors_1.NotFoundError('Attachment not found');
        const localPath = (0, node_path_1.join)(UPLOADS_DIR, att.s3Key.replace(/\//g, '_'));
        if (!(0, node_fs_1.existsSync)(localPath))
            throw new errors_1.NotFoundError('File not found on disk');
        return { buffer: (0, node_fs_1.readFileSync)(localPath), fileName: att.fileName, fileType: att.fileType };
    }
    async delete(attachmentId, requesterId) {
        const att = await this.repo.findOne({ where: { id: attachmentId } });
        if (!att)
            throw new errors_1.NotFoundError('Attachment not found');
        if (att.uploadedById !== requesterId)
            throw new errors_1.ForbiddenError('Cannot delete this attachment');
        if (!isS3Configured()) {
            const localPath = (0, node_path_1.join)(UPLOADS_DIR, att.s3Key.replace(/\//g, '_'));
            if ((0, node_fs_1.existsSync)(localPath))
                (0, node_fs_1.unlinkSync)(localPath);
        }
        await this.repo.delete(attachmentId);
    }
}
exports.AttachmentService = AttachmentService;
//# sourceMappingURL=attachment.service.js.map