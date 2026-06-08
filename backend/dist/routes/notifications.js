"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notification_controller_1 = require("../controllers/notification.controller");
const notifications = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new notification_controller_1.NotificationController(f);
        f.get('/', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.findAll.bind(ctrl));
        f.get('/unread-count', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.getUnreadCount.bind(ctrl));
        f.patch('/read-all', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.markAllRead.bind(ctrl));
        f.patch('/:id/read', { schema: { tags: ['notifications'] }, preHandler: [f.authenticate] }, ctrl.markRead.bind(ctrl));
    }, { prefix: '/api/notifications' });
};
exports.default = notifications;
//# sourceMappingURL=notifications.js.map