import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; spellId: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, spellId } = await params

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

  const spell = await prisma.spell.update({
    where: { id: spellId },
    data: body
  })

  return NextResponse.json(spell)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; spellId: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, spellId } = await params

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

  await prisma.spell.delete({
    where: { id: spellId }
  })

  return NextResponse.json({ success: true })
}
