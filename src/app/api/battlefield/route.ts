import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the active battlefield or the most recent one
  let battlefield = await prisma.battlefieldState.findFirst({
    where: { isActive: true }
  })

  if (!battlefield) {
    battlefield = await prisma.battlefieldState.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
  }

  if (!battlefield) {
    // Create a default battlefield
    battlefield = await prisma.battlefieldState.create({
      data: {
        name: 'Battle Map',
        isActive: true
      }
    })
  }

  return NextResponse.json(battlefield)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, tokens, mapImageUrl, gridSize, gridWidth, gridHeight, name } = body

  // Check permissions for certain operations
  const isDM = session.user.role === 'DM'

  // Only DM can change map settings
  if (!isDM && (mapImageUrl !== undefined || gridSize !== undefined || gridWidth !== undefined || gridHeight !== undefined || name !== undefined)) {
    return NextResponse.json({ error: 'Only DM can change map settings' }, { status: 403 })
  }

  // For token updates, check if player is moving their own token
  if (tokens !== undefined && !isDM) {
    const battlefield = await prisma.battlefieldState.findUnique({
      where: { id }
    })

    if (battlefield) {
      const oldTokens = battlefield.tokens as { id: string; characterId?: string }[]
      const newTokens = tokens as { id: string; characterId?: string; x: number; y: number }[]

      // Get player's character IDs
      const playerCharacters = await prisma.character.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      })
      const playerCharacterIds = playerCharacters.map(c => c.id)

      // Check if any non-owned token was moved
      for (const newToken of newTokens) {
        const oldToken = oldTokens.find(t => t.id === newToken.id)
        if (oldToken) {
          // Token exists - check if it was moved
          const oldTokenData = oldToken as { x?: number; y?: number; characterId?: string }
          if (oldTokenData.x !== newToken.x || oldTokenData.y !== newToken.y) {
            // Token was moved - verify ownership
            if (!newToken.characterId || !playerCharacterIds.includes(newToken.characterId)) {
              return NextResponse.json({ error: 'Cannot move tokens you do not own' }, { status: 403 })
            }
          }
        }
      }
    }
  }

  const updateData: Record<string, unknown> = {}
  if (tokens !== undefined) updateData.tokens = tokens
  if (mapImageUrl !== undefined) updateData.mapImageUrl = mapImageUrl
  if (gridSize !== undefined) updateData.gridSize = gridSize
  if (gridWidth !== undefined) updateData.gridWidth = gridWidth
  if (gridHeight !== undefined) updateData.gridHeight = gridHeight
  if (name !== undefined) updateData.name = name

  const battlefield = await prisma.battlefieldState.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json(battlefield)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'DM') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, mapImageUrl, gridSize, gridWidth, gridHeight } = body

  // Deactivate other battlefields
  await prisma.battlefieldState.updateMany({
    data: { isActive: false }
  })

  const battlefield = await prisma.battlefieldState.create({
    data: {
      name: name || 'New Battle Map',
      mapImageUrl,
      gridSize: gridSize || 40,
      gridWidth: gridWidth || 20,
      gridHeight: gridHeight || 15,
      isActive: true
    }
  })

  return NextResponse.json(battlefield)
}
