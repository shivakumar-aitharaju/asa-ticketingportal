import fp from 'fastify-plugin'
import socketio from 'fastify-socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: import('socket.io').Server
  }
}

export default fp(async function (fastify) {
  await fastify.register(socketio, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  fastify.ready(() => {
    fastify.io.on('connection', (socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      // Join personal room after auth
      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`)
        fastify.log.info(`Socket ${socket.id} joined user:${userId}`)
      })

      // Join department room (for Team Leaders)
      socket.on('join:department', (departmentId: string) => {
        socket.join(`dept:${departmentId}`)
      })

      // Join ticket room (for real-time conversation updates)
      socket.on('join:ticket', (ticketId: string) => {
        socket.join(`ticket:${ticketId}`)
      })

      socket.on('disconnect', () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`)
      })
    })
  })
}, { name: 'socket', dependencies: ['env'] })
