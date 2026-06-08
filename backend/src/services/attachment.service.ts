import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { DataSource, Repository } from 'typeorm'
import type { MultipartFile } from '@fastify/multipart'
import { Attachment } from '../entities/attachment.entity'
import { NotFoundError, ForbiddenError } from '../utils/errors'

const UPLOADS_DIR = join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
}

function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME)
}

export class AttachmentService {
  private repo: Repository<Attachment>

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Attachment)
  }

  async upload(ticketId: string, uploadedById: string, file: MultipartFile): Promise<Attachment> {
    const buffer = await file.toBuffer()
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`)
    }

    const ext = file.filename.includes('.') ? file.filename.split('.').pop()! : ''
    const s3Key = `tickets/${ticketId}/${randomUUID()}${ext ? '.' + ext : ''}`
    const bucket = process.env.AWS_S3_BUCKET_NAME ?? 'local'

    if (isS3Configured()) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' })
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: file.mimetype,
      }))
    } else {
      ensureUploadsDir()
      const localPath = join(UPLOADS_DIR, s3Key.replace(/\//g, '_'))
      writeFileSync(localPath, buffer)
    }

    const attachment = this.repo.create({
      ticketId,
      uploadedById,
      fileName: file.filename,
      fileType: file.mimetype,
      fileSize: buffer.length,
      s3Key,
      s3Bucket: bucket,
    })

    return this.repo.save(attachment)
  }

  async listForTicket(ticketId: string): Promise<Attachment[]> {
    return this.repo.find({
      where: { ticketId },
      relations: ['uploadedBy'],
      order: { createdAt: 'ASC' },
    })
  }

  async getDownloadUrl(attachmentId: string, requesterId: string): Promise<string> {
    const att = await this.repo.findOne({ where: { id: attachmentId } })
    if (!att) throw new NotFoundError('Attachment not found')

    if (isS3Configured()) {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
      const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' })
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: att.s3Bucket, Key: att.s3Key }), { expiresIn: 3600 })
    }

    // Local: return API download path
    return `/api/attachments/${att.id}/file`
  }

  async serveLocalFile(attachmentId: string): Promise<{ buffer: Buffer; fileName: string; fileType: string }> {
    const att = await this.repo.findOne({ where: { id: attachmentId } })
    if (!att) throw new NotFoundError('Attachment not found')

    const localPath = join(UPLOADS_DIR, att.s3Key.replace(/\//g, '_'))
    if (!existsSync(localPath)) throw new NotFoundError('File not found on disk')

    return { buffer: readFileSync(localPath), fileName: att.fileName, fileType: att.fileType }
  }

  async delete(attachmentId: string, requesterId: string): Promise<void> {
    const att = await this.repo.findOne({ where: { id: attachmentId } })
    if (!att) throw new NotFoundError('Attachment not found')
    if (att.uploadedById !== requesterId) throw new ForbiddenError('Cannot delete this attachment')

    if (!isS3Configured()) {
      const localPath = join(UPLOADS_DIR, att.s3Key.replace(/\//g, '_'))
      if (existsSync(localPath)) unlinkSync(localPath)
    }

    await this.repo.delete(attachmentId)
  }
}
