import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join-battlefield', (battlefieldId: string) => {
        socket.join(battlefieldId)
        console.log(`Socket ${socket.id} joined battlefield ${battlefieldId}`)
      })

      socket.on('leave-battlefield', (battlefieldId: string) => {
        socket.leave(battlefieldId)
        console.log(`Socket ${socket.id} left battlefield ${battlefieldId}`)
      })

      socket.on('token-move', (data: { battlefieldId: string; tokenId: string; x: number; y: number }) => {
        // Broadcast to all clients in the battlefield except sender
        socket.to(data.battlefieldId).emit('token-moved', data)
      })

      socket.on('tokens-update', (data: { battlefieldId: string; tokens: unknown[] }) => {
        // Broadcast full token update
        socket.to(data.battlefieldId).emit('tokens-updated', data)
      })

      socket.on('map-update', (data: { battlefieldId: string; mapImageUrl?: string; gridSize?: number }) => {
        // Broadcast map settings update
        socket.to(data.battlefieldId).emit('map-updated', data)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }
  return res.socket.server.io
}
