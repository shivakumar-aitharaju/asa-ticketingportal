import type { FastifyPluginAsync } from 'fastify/types/plugin'
import { NotificationController } from '../controllers/notification.controller'

const notifications: FastifyPluginAsync = async function (fastify) {
  await fastify.register(async function (f) {
    const ctrl = new NotificationController(f)

    f.get('/', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.findAll.bind(ctrl))
    f.get('/unread-count', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.getUnreadCount.bind(ctrl))
    f.patch('/read-all', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.markAllRead.bind(ctrl))
    f.patch('/:id/read', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.markRead.bind(ctrl))

  }, { prefix: '/api/notifications' })
}

export default notifications
