'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Character {
  id: string
  name: string
  race: string
  class: string
  level: number
  hp: number
  maxHp: number
  armorClass: number
}

interface User {
  id: string
  username: string
  role: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [characters, setCharacters] = useState<Character[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCharacter, setShowCreateCharacter] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newCharacter, setNewCharacter] = useState({ name: '', race: '', class: '', userId: '' })
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'PLAYER' })

  const isDM = session?.user?.role === 'DM'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [charsRes, usersRes] = await Promise.all([
        fetch('/api/characters'),
        isDM ? fetch('/api/users') : Promise.resolve(null)
      ])

      const charsData = await charsRes.json()
      setCharacters(charsData)

      if (usersRes) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const createCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCharacter,
          userId: isDM && newCharacter.userId ? newCharacter.userId : session?.user?.id
        })
      })
      if (res.ok) {
        setNewCharacter({ name: '', race: '', class: '', userId: '' })
        setShowCreateCharacter(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error creating character:', error)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      if (res.ok) {
        setNewUser({ username: '', password: '', role: 'PLAYER' })
        setShowCreateUser(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const updateHP = async (characterId: string, delta: number) => {
    const character = characters.find(c => c.id === characterId)
    if (!character) return

    const newHp = Math.max(0, Math.min(character.maxHp, character.hp + delta))
    try {
      await fetch(`/api/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hp: newHp })
      })
      setCharacters(chars =>
        chars.map(c => (c.id === characterId ? { ...c, hp: newHp } : c))
      )
    } catch (error) {
      console.error('Error updating HP:', error)
    }
  }

  const getHPClass = (hp: number, maxHp: number) => {
    const percent = (hp / maxHp) * 100
    if (percent <= 25) return 'critical'
    if (percent <= 50) return 'damaged'
    return ''
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--gold)] text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
          Loading your adventure...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--gold)]">Campaign Dashboard</h1>
          <p className="text-[var(--parchment)]">
            Welcome, {session?.user?.name} ({session?.user?.role})
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/battlefield" className="btn-forest">
            Battle Map
          </Link>
          <button onClick={() => signOut()} className="btn-gold">
            Sign Out
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Characters Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-[var(--gold)]">Characters</h2>
            <button
              onClick={() => setShowCreateCharacter(true)}
              className="btn-gold"
            >
              + New Character
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="fantasy-card p-8 text-center">
              <p className="text-[var(--stone-gray)]">No characters yet. Create one to begin your adventure!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {characters.map(character => (
                <div key={character.id} className="fantasy-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--forest-green)]">
                        {character.name}
                      </h3>
                      <p className="text-sm text-[var(--stone-gray)]">
                        Level {character.level} {character.race} {character.class}
                      </p>
                    </div>
                    <div className="stat-block px-3">
                      <div className="stat-label">AC</div>
                      <div className="stat-value text-lg">{character.armorClass}</div>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1 text-[var(--stone-gray)]">
                      <span>HP</span>
                      <span>{character.hp} / {character.maxHp}</span>
                    </div>
                    <div className="hp-bar">
                      <div
                        className={`hp-fill ${getHPClass(character.hp, character.maxHp)}`}
                        style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      <button
                        onClick={() => updateHP(character.id, -1)}
                        className="w-8 h-8 rounded bg-[var(--deep-red)] text-white font-bold hover:bg-[var(--deep-red-light)]"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateHP(character.id, 1)}
                        className="w-8 h-8 rounded bg-green-600 text-white font-bold hover:bg-green-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/character/${character.id}`}
                    className="btn-forest w-full block text-center py-2"
                  >
                    View Character Sheet
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - DM Controls */}
        {isDM && (
          <div className="space-y-6">
            <div className="fantasy-card p-4">
              <h2 className="text-xl text-[var(--forest-green)] mb-4">Party Members</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="btn-gold w-full mb-4"
              >
                + Add Player
              </button>
              <div className="space-y-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-2 bg-[var(--parchment-dark)] rounded"
                  >
                    <span className="text-[var(--stone-gray)] font-medium">
                      {user.username}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        user.role === 'DM'
                          ? 'bg-[var(--gold)] text-[var(--forest-green)]'
                          : 'bg-[var(--forest-green)] text-[var(--parchment)]'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fantasy-card p-4">
              <h2 className="text-xl text-[var(--forest-green)] mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/battlefield" className="btn-forest w-full block text-center">
                  Open Battle Map
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Character Modal */}
      {showCreateCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="fantasy-card p-6 w-full max-w-md">
            <h2 className="text-2xl text-[var(--forest-green)] mb-4">Create Character</h2>
            <form onSubmit={createCharacter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Character Name
                </label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={e => setNewCharacter({ ...newCharacter, name: e.target.value })}
                  className="fantasy-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Race
                </label>
                <select
                  value={newCharacter.race}
                  onChange={e => setNewCharacter({ ...newCharacter, race: e.target.value })}
                  className="fantasy-input w-full"
                  required
                >
                  <option value="">Select Race</option>
                  <option value="Human">Human</option>
                  <option value="Elf">Elf</option>
                  <option value="Dwarf">Dwarf</option>
                  <option value="Halfling">Halfling</option>
                  <option value="Dragonborn">Dragonborn</option>
                  <option value="Gnome">Gnome</option>
                  <option value="Half-Elf">Half-Elf</option>
                  <option value="Half-Orc">Half-Orc</option>
                  <option value="Tiefling">Tiefling</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Class
                </label>
                <select
                  value={newCharacter.class}
                  onChange={e => setNewCharacter({ ...newCharacter, class: e.target.value })}
                  className="fantasy-input w-full"
                  required
                >
                  <option value="">Select Class</option>
                  <option value="Barbarian">Barbarian</option>
                  <option value="Bard">Bard</option>
                  <option value="Cleric">Cleric</option>
                  <option value="Druid">Druid</option>
                  <option value="Fighter">Fighter</option>
                  <option value="Monk">Monk</option>
                  <option value="Paladin">Paladin</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Rogue">Rogue</option>
                  <option value="Sorcerer">Sorcerer</option>
                  <option value="Warlock">Warlock</option>
                  <option value="Wizard">Wizard</option>
                </select>
              </div>
              {isDM && (
                <div>
                  <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                    Assign to Player (optional)
                  </label>
                  <select
                    value={newCharacter.userId}
                    onChange={e => setNewCharacter({ ...newCharacter, userId: e.target.value })}
                    className="fantasy-input w-full"
                  >
                    <option value="">Assign to myself</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCharacter(false)}
                  className="btn-forest flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="fantasy-card p-6 w-full max-w-md">
            <h2 className="text-2xl text-[var(--forest-green)] mb-4">Add Player</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="fantasy-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="fantasy-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="fantasy-input w-full"
                >
                  <option value="PLAYER">Player</option>
                  <option value="DM">Dungeon Master</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="btn-forest flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
