'use client'

import { useState } from 'react'

interface Spell {
  id: string
  name: string
  level: number
  school?: string | null
  castingTime?: string | null
  range?: string | null
  components?: string | null
  duration?: string | null
  description?: string | null
  prepared: boolean
}

interface SpellListProps {
  spells: Spell[]
  characterId: string
  editable: boolean
  onUpdate: () => void
}

const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
]

export default function SpellList({ spells, characterId, editable, onUpdate }: SpellListProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null)
  const [newSpell, setNewSpell] = useState({
    name: '', level: 0, school: '', castingTime: '', range: '',
    components: '', duration: '', description: ''
  })

  const addSpell = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/characters/${characterId}/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpell)
      })
      setNewSpell({
        name: '', level: 0, school: '', castingTime: '', range: '',
        components: '', duration: '', description: ''
      })
      setShowAdd(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding spell:', error)
    }
  }

  const removeSpell = async (spellId: string) => {
    try {
      await fetch(`/api/characters/${characterId}/spells/${spellId}`, {
        method: 'DELETE'
      })
      onUpdate()
    } catch (error) {
      console.error('Error removing spell:', error)
    }
  }

  const togglePrepared = async (spell: Spell) => {
    try {
      await fetch(`/api/characters/${characterId}/spells/${spell.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prepared: !spell.prepared })
      })
      onUpdate()
    } catch (error) {
      console.error('Error toggling prepared:', error)
    }
  }

  // Group spells by level
  const spellsByLevel = spells.reduce((acc, spell) => {
    const level = spell.level
    if (!acc[level]) acc[level] = []
    acc[level].push(spell)
    return acc
  }, {} as Record<number, Spell[]>)

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'Cantrips'
    return `Level ${level}`
  }

  return (
    <div className="fantasy-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-[var(--forest-green)]">Spells</h3>
        <div className="text-sm text-[var(--stone-gray)]">
          {spells.filter(s => s.prepared).length} prepared
        </div>
      </div>

      {spells.length === 0 ? (
        <p className="text-[var(--stone-gray-light)] text-center py-4">
          No spells known
        </p>
      ) : (
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {Object.entries(spellsByLevel)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, levelSpells]) => (
              <div key={level}>
                <h4 className="text-sm font-bold text-[var(--gold)] mb-2 border-b border-[var(--gold)]">
                  {getLevelLabel(parseInt(level))}
                </h4>
                <div className="space-y-1">
                  {levelSpells.map(spell => (
                    <div key={spell.id}>
                      <div
                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                          spell.prepared ? 'bg-[var(--gold)]/20' : 'bg-[var(--parchment-dark)]'
                        }`}
                        onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                      >
                        <div className="flex items-center gap-3">
                          {editable && spell.level > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePrepared(spell)
                              }}
                              className={`w-5 h-5 rounded border-2 ${
                                spell.prepared
                                  ? 'bg-[var(--gold)] border-[var(--gold)]'
                                  : 'border-[var(--stone-gray)]'
                              }`}
                              title={spell.prepared ? 'Unprepare' : 'Prepare'}
                            >
                              {spell.prepared && (
                                <svg className="w-full h-full text-[var(--forest-green)]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )}
                          <div>
                            <span className="font-medium text-[var(--stone-gray)]">{spell.name}</span>
                            {spell.school && (
                              <span className="text-xs text-[var(--stone-gray-light)] ml-2">
                                ({spell.school})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--stone-gray-light)]">
                            {expandedSpell === spell.id ? '▲' : '▼'}
                          </span>
                          {editable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSpell(spell.id)
                              }}
                              className="text-[var(--deep-red)] hover:text-[var(--deep-red-light)] text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      {expandedSpell === spell.id && (
                        <div className="p-3 bg-[var(--parchment)] text-sm text-[var(--stone-gray)] mt-1 rounded">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {spell.castingTime && (
                              <div><strong>Casting Time:</strong> {spell.castingTime}</div>
                            )}
                            {spell.range && (
                              <div><strong>Range:</strong> {spell.range}</div>
                            )}
                            {spell.components && (
                              <div><strong>Components:</strong> {spell.components}</div>
                            )}
                            {spell.duration && (
                              <div><strong>Duration:</strong> {spell.duration}</div>
                            )}
                          </div>
                          {spell.description && (
                            <p className="whitespace-pre-wrap">{spell.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {editable && (
        <>
          {showAdd ? (
            <form onSubmit={addSpell} className="space-y-3 border-t border-[var(--stone-gray)] pt-4">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Spell name"
                  value={newSpell.name}
                  onChange={e => setNewSpell({ ...newSpell, name: e.target.value })}
                  className="fantasy-input text-sm"
                  required
                />
                <select
                  value={newSpell.level}
                  onChange={e => setNewSpell({ ...newSpell, level: parseInt(e.target.value) })}
                  className="fantasy-input text-sm"
                >
                  <option value={0}>Cantrip</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSpell.school}
                  onChange={e => setNewSpell({ ...newSpell, school: e.target.value })}
                  className="fantasy-input text-sm"
                >
                  <option value="">School (optional)</option>
                  {SPELL_SCHOOLS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Casting time"
                  value={newSpell.castingTime}
                  onChange={e => setNewSpell({ ...newSpell, castingTime: e.target.value })}
                  className="fantasy-input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Range"
                  value={newSpell.range}
                  onChange={e => setNewSpell({ ...newSpell, range: e.target.value })}
                  className="fantasy-input text-sm"
                />
                <input
                  type="text"
                  placeholder="Components (V, S, M)"
                  value={newSpell.components}
                  onChange={e => setNewSpell({ ...newSpell, components: e.target.value })}
                  className="fantasy-input text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Duration"
                value={newSpell.duration}
                onChange={e => setNewSpell({ ...newSpell, duration: e.target.value })}
                className="fantasy-input text-sm w-full"
              />
              <textarea
                placeholder="Description"
                value={newSpell.description}
                onChange={e => setNewSpell({ ...newSpell, description: e.target.value })}
                className="fantasy-input text-sm w-full h-24"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-gold text-sm flex-1">Add</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-forest text-sm flex-1">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAdd(true)} className="btn-forest w-full text-sm">
              + Add Spell
            </button>
          )}
        </>
      )}
    </div>
  )
}
