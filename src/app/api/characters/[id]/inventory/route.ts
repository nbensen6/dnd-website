import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const character = await prisma.character.findUnique({
    where: { id }
  })

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const isDM = session.user.role === 'DM'
  if (!isDM && character.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, quantity, description, weight } = body

  const item = await prisma.inventoryItem.create({
    data: {
      characterId: id,
      name,
      quantity: quantity || 1,
      description,
      weight
    }
  })

  return NextResponse.json(item)
}
