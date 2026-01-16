import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isDM = session.user.role === 'DM'

  const characters = await prisma.character.findMany({
    where: isDM ? {} : { userId: session.user.id },
    include: {
      user: {
        select: { username: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(characters)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, race, class: characterClass, userId } = body

  if (!name || !race || !characterClass) {
    return NextResponse.json({ error: 'Name, race, and class are required' }, { status: 400 })
  }

  // Only DM can assign characters to other users
  const assignedUserId = session.user.role === 'DM' && userId ? userId : session.user.id

  const character = await prisma.character.create({
    data: {
      name,
      race,
      class: characterClass,
      userId: assignedUserId
    }
  })

  return NextResponse.json(character)
}
