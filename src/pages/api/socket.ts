import { NextApiRequest } from 'next'
import { initSocket, NextApiResponseWithSocket } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    initSocket(res)
  }
  res.end()
}
