'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { io, Socket } from 'socket.io-client'

// Dynamically import the entire canvas component to avoid SSR issues with Konva
const BattlefieldCanvas = dynamic(() => import('@/components/BattlefieldCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0f2a1f]">
      <div className="text-[var(--gold)]">Loading battlefield...</div>
    </div>
  )
})

interface Token {
  id: string
  characterId?: string
  name: string
  x: number
  y: number
  size: number
  color: string
  isNPC: boolean
}

interface BattlefieldState {
  id: string
  name: string
  mapImageUrl?: string | null
  gridSize: number
  gridWidth: number
  gridHeight: number
  tokens: Token[]
}

interface Character {
  id: string
  name: string
  userId: string
}

const TOKEN_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937'
]

export default function BattlefieldPage() {
  const { data: session } = useSession()
  const [battlefield, setBattlefield] = useState<BattlefieldState | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [showAddToken, setShowAddToken] = useState(false)
  const [showMapSettings, setShowMapSettings] = useState(false)
  const [newToken, setNewToken] = useState({ name: '', characterId: '', color: TOKEN_COLORS[0], isNPC: false })
  const [mapSettings, setMapSettings] = useState({ gridSize: 40, gridWidth: 20, gridHeight: 15, mapImageUrl: '' })
  const socketRef = useRef<Socket | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isDM = session?.user?.role === 'DM'

  useEffect(() => {
    fetchData()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const initSocket = () => {
    socketRef.current = io({
      path: '/api/socket'
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to socket')
    })

    socketRef.current.on('token-moved', (data: { tokenId: string; x: number; y: number }) => {
      setBattlefield(prev => {
        if (!prev) return prev
        return {
          ...prev,
          tokens: prev.tokens.map(t =>
            t.id === data.tokenId ? { ...t, x: data.x, y: data.y } : t
          )
        }
      })
    })

    socketRef.current.on('tokens-updated', (data: { tokens: Token[] }) => {
      setBattlefield(prev => prev ? { ...prev, tokens: data.tokens } : prev)
    })

    socketRef.current.on('map-updated', (data: { mapImageUrl?: string; gridSize?: number }) => {
      setBattlefield(prev => {
        if (!prev) return prev
        return {
          ...prev,
          ...(data.mapImageUrl !== undefined && { mapImageUrl: data.mapImageUrl }),
          ...(data.gridSize !== undefined && { gridSize: data.gridSize })
        }
      })
    })
  }

  const fetchData = async () => {
    try {
      const [bfRes, charsRes] = await Promise.all([
        fetch('/api/battlefield'),
        fetch('/api/characters')
      ])

      const bfData = await bfRes.json()
      setBattlefield({
        ...bfData,
        tokens: Array.isArray(bfData.tokens) ? bfData.tokens : JSON.parse(bfData.tokens || '[]')
      })
      setMapSettings({
        gridSize: bfData.gridSize,
        gridWidth: bfData.gridWidth,
        gridHeight: bfData.gridHeight,
        mapImageUrl: bfData.mapImageUrl || ''
      })

      if (socketRef.current) {
        socketRef.current.emit('join-battlefield', bfData.id)
      }

      const charsData = await charsRes.json()
      setCharacters(charsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const updateBattlefield = async (updates: Partial<BattlefieldState>) => {
    if (!battlefield) return
    try {
      await fetch('/api/battlefield', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: battlefield.id, ...updates })
      })
    } catch (error) {
      console.error('Error updating battlefield:', error)
    }
  }

  const handleTokenDragEnd = useCallback((token: Token, newX: number, newY: number) => {
    if (!battlefield) return

    // Snap to grid
    const snappedX = Math.round(newX / battlefield.gridSize) * battlefield.gridSize
    const snappedY = Math.round(newY / battlefield.gridSize) * battlefield.gridSize

    const updatedTokens = battlefield.tokens.map(t =>
      t.id === token.id ? { ...t, x: snappedX, y: snappedY } : t
    )

    setBattlefield({ ...battlefield, tokens: updatedTokens })
    updateBattlefield({ tokens: updatedTokens })

    // Broadcast move
    if (socketRef.current) {
      socketRef.current.emit('token-move', {
        battlefieldId: battlefield.id,
        tokenId: token.id,
        x: snappedX,
        y: snappedY
      })
    }
  }, [battlefield])

  const canMoveToken = useCallback((token: Token) => {
    if (isDM) return true
    if (token.isNPC) return false
    if (!token.characterId) return false
    const character = characters.find(c => c.id === token.characterId)
    return character?.userId === session?.user?.id
  }, [isDM, characters, session?.user?.id])

  const addToken = async () => {
    if (!battlefield || !newToken.name) return

    const token: Token = {
      id: crypto.randomUUID(),
      name: newToken.name,
      characterId: newToken.characterId || undefined,
      x: battlefield.gridSize,
      y: battlefield.gridSize,
      size: battlefield.gridSize * 0.8,
      color: newToken.color,
      isNPC: newToken.isNPC
    }

    const updatedTokens = [...battlefield.tokens, token]
    setBattlefield({ ...battlefield, tokens: updatedTokens })
    await updateBattlefield({ tokens: updatedTokens })

    if (socketRef.current) {
      socketRef.current.emit('tokens-update', {
        battlefieldId: battlefield.id,
        tokens: updatedTokens
      })
    }

    setNewToken({ name: '', characterId: '', color: TOKEN_COLORS[0], isNPC: false })
    setShowAddToken(false)
  }

  const removeToken = useCallback(async (tokenId: string) => {
    if (!battlefield || !isDM) return

    const updatedTokens = battlefield.tokens.filter(t => t.id !== tokenId)
    setBattlefield({ ...battlefield, tokens: updatedTokens })
    await updateBattlefield({ tokens: updatedTokens })

    if (socketRef.current) {
      socketRef.current.emit('tokens-update', {
        battlefieldId: battlefield.id,
        tokens: updatedTokens
      })
    }
  }, [battlefield, isDM])

  const updateMapSettings = async () => {
    if (!battlefield || !isDM) return

    await updateBattlefield({
      gridSize: mapSettings.gridSize,
      gridWidth: mapSettings.gridWidth,
      gridHeight: mapSettings.gridHeight,
      mapImageUrl: mapSettings.mapImageUrl || null
    })

    setBattlefield({
      ...battlefield,
      ...mapSettings,
      mapImageUrl: mapSettings.mapImageUrl || null
    })

    if (socketRef.current) {
      socketRef.current.emit('map-update', {
        battlefieldId: battlefield.id,
        mapImageUrl: mapSettings.mapImageUrl,
        gridSize: mapSettings.gridSize
      })
    }

    setShowMapSettings(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const scaleBy = 1.1
    const newScale = e.deltaY < 0 ? scale * scaleBy : scale / scaleBy
    setScale(Math.max(0.25, Math.min(3, newScale)))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--gold)] text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
          Preparing the battlefield...
        </div>
      </div>
    )
  }

  if (!battlefield) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fantasy-card p-8">
          <h1 className="text-2xl text-[var(--forest-green)] mb-4">No Battlefield</h1>
          <Link href="/dashboard" className="btn-gold">Return to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-[var(--gold)]/30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[var(--gold)] hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-[var(--gold)]">{battlefield.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--parchment)]">
            Zoom: {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(1)}
            className="btn-forest text-sm py-1 px-2"
          >
            Reset
          </button>
          {isDM && (
            <>
              <button
                onClick={() => setShowMapSettings(true)}
                className="btn-forest text-sm py-1 px-2"
              >
                Map Settings
              </button>
              <button
                onClick={() => setShowAddToken(true)}
                className="btn-gold text-sm py-1 px-2"
              >
                + Add Token
              </button>
            </>
          )}
        </div>
      </header>

      {/* Battlefield Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-[#0f2a1f] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
      >
        <BattlefieldCanvas
          battlefield={battlefield}
          scale={scale}
          stagePos={stagePos}
          setStagePos={setStagePos}
          canMoveToken={canMoveToken}
          handleTokenDragEnd={handleTokenDragEnd}
          isDM={isDM}
          removeToken={removeToken}
        />
      </div>

      {/* Token Legend */}
      <div className="p-4 border-t border-[var(--gold)]/30">
        <div className="flex flex-wrap gap-4">
          {battlefield.tokens.map(token => (
            <div key={token.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: token.color }}
              />
              <span className="text-[var(--parchment)]">
                {token.name}
                {token.isNPC && <span className="text-[var(--gold)] ml-1">(NPC)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Token Modal */}
      {showAddToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="fantasy-card p-6 w-full max-w-md">
            <h2 className="text-2xl text-[var(--forest-green)] mb-4">Add Token</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Token Name
                </label>
                <input
                  type="text"
                  value={newToken.name}
                  onChange={e => setNewToken({ ...newToken, name: e.target.value })}
                  className="fantasy-input w-full"
                  placeholder="e.g. Goblin 1, Gundren"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Link to Character (optional)
                </label>
                <select
                  value={newToken.characterId}
                  onChange={e => setNewToken({ ...newToken, characterId: e.target.value, isNPC: false })}
                  className="fantasy-input w-full"
                >
                  <option value="">No linked character (NPC)</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-[var(--stone-gray)]">
                  <input
                    type="checkbox"
                    checked={newToken.isNPC}
                    onChange={e => setNewToken({ ...newToken, isNPC: e.target.checked, characterId: '' })}
                    className="w-4 h-4"
                  />
                  Is NPC/Enemy (only DM can move)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-2">
                  Token Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOKEN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewToken({ ...newToken, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newToken.color === color ? 'border-[var(--gold)]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addToken} className="btn-gold flex-1">
                  Add Token
                </button>
                <button
                  onClick={() => setShowAddToken(false)}
                  className="btn-forest flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Settings Modal */}
      {showMapSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="fantasy-card p-6 w-full max-w-md">
            <h2 className="text-2xl text-[var(--forest-green)] mb-4">Map Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                  Map Image URL
                </label>
                <input
                  type="url"
                  value={mapSettings.mapImageUrl}
                  onChange={e => setMapSettings({ ...mapSettings, mapImageUrl: e.target.value })}
                  className="fantasy-input w-full"
                  placeholder="https://example.com/map.jpg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                    Grid Size (px)
                  </label>
                  <input
                    type="number"
                    value={mapSettings.gridSize}
                    onChange={e => setMapSettings({ ...mapSettings, gridSize: parseInt(e.target.value) || 40 })}
                    className="fantasy-input w-full"
                    min={20}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                    Width (cells)
                  </label>
                  <input
                    type="number"
                    value={mapSettings.gridWidth}
                    onChange={e => setMapSettings({ ...mapSettings, gridWidth: parseInt(e.target.value) || 20 })}
                    className="fantasy-input w-full"
                    min={5}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--stone-gray)] mb-1">
                    Height (cells)
                  </label>
                  <input
                    type="number"
                    value={mapSettings.gridHeight}
                    onChange={e => setMapSettings({ ...mapSettings, gridHeight: parseInt(e.target.value) || 15 })}
                    className="fantasy-input w-full"
                    min={5}
                    max={100}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={updateMapSettings} className="btn-gold flex-1">
                  Save Settings
                </button>
                <button
                  onClick={() => setShowMapSettings(false)}
                  className="btn-forest flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
