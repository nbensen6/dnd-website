import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create DM user
  const dmPassword = await bcrypt.hash('dm123', 10)
  const dm = await prisma.user.upsert({
    where: { username: 'dm' },
    update: {},
    create: {
      username: 'dm',
      password: dmPassword,
      role: 'DM'
    }
  })
  console.log('Created DM user:', dm.username)

  // Create sample player users
  const playerPassword = await bcrypt.hash('player123', 10)
  const playerNames = ['player1', 'player2', 'player3', 'player4']

  for (const name of playerNames) {
    const player = await prisma.user.upsert({
      where: { username: name },
      update: {},
      create: {
        username: name,
        password: playerPassword,
        role: 'PLAYER'
      }
    })
    console.log('Created player user:', player.username)
  }

  // Create initial battlefield
  const battlefield = await prisma.battlefieldState.upsert({
    where: { id: 'default-battlefield' },
    update: {},
    create: {
      id: 'default-battlefield',
      name: 'Cragmaw Hideout',
      gridSize: 40,
      gridWidth: 20,
      gridHeight: 15,
      isActive: true,
      tokens: []
    }
  })
  console.log('Created battlefield:', battlefield.name)

  console.log('\n=== Seed Complete ===')
  console.log('DM Login: username: dm, password: dm123')
  console.log('Player Logins: username: player1-4, password: player123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
