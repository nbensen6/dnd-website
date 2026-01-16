'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import StatBlock, { getModifier, formatModifier } from '@/components/StatBlock'
import Inventory from '@/components/Inventory'
import SpellList from '@/components/SpellList'

interface Character {
  id: string
  userId: string
  name: string
  race: string
  class: string
  level: number
  background?: string | null
  alignment?: string | null
  experiencePoints: number
  hp: number
  maxHp: number
  tempHp: number
  hitDice?: string | null
  hitDiceRemaining: number
  armorClass: number
  initiative: number
  speed: number
  proficiencyBonus: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrowProficiencies: string[]
  skillProficiencies: string[]
  features?: string | null
  traits?: string | null
  ideals?: string | null
  bonds?: string | null
  flaws?: string | null
  notes?: string | null
  deathSaveSuccesses: number
  deathSaveFailures: number
  copperPieces: number
  silverPieces: number
  electrumPieces: number
  goldPieces: number
  platinumPieces: number
  inventory: {
    id: string
    name: string
    quantity: number
    description?: string | null
    weight?: number | null
    equipped: boolean
  }[]
  spells: {
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
  }[]
  user: { username: string }
}

const SKILLS = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' }
]

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const

export default function CharacterSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isDM = session?.user?.role === 'DM'
  const canEdit = isDM || character?.userId === session?.user?.id

  useEffect(() => {
    fetchCharacter()
  }, [resolvedParams.id])

  const fetchCharacter = async () => {
    try {
      const res = await fetch(`/api/characters/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setCharacter(data)
      }
    } catch (error) {
      console.error('Error fetching character:', error)
    }
    setLoading(false)
  }

  const updateCharacter = async (updates: Partial<Character>) => {
    if (!character || !canEdit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        setCharacter({ ...character, ...updates })
      }
    } catch (error) {
      console.error('Error updating character:', error)
    }
    setSaving(false)
  }

  const getHPClass = () => {
    if (!character) return ''
    const percent = (character.hp / character.maxHp) * 100
    if (percent <= 25) return 'critical'
    if (percent <= 50) return 'damaged'
    return ''
  }

  const getSkillModifier = (skill: typeof SKILLS[0]) => {
    if (!character) return 0
    const abilityMod = getModifier(character[skill.ability as keyof Character] as number)
    const isProficient = character.skillProficiencies.includes(skill.name)
    return abilityMod + (isProficient ? character.proficiencyBonus : 0)
  }

  const toggleSkillProficiency = (skillName: string) => {
    if (!character || !canEdit) return
    const newProficiencies = character.skillProficiencies.includes(skillName)
      ? character.skillProficiencies.filter(s => s !== skillName)
      : [...character.skillProficiencies, skillName]
    updateCharacter({ skillProficiencies: newProficiencies })
  }

  const toggleSavingThrowProficiency = (ability: string) => {
    if (!character || !canEdit) return
    const newProficiencies = character.savingThrowProficiencies.includes(ability)
      ? character.savingThrowProficiencies.filter(s => s !== ability)
      : [...character.savingThrowProficiencies, ability]
    updateCharacter({ savingThrowProficiencies: newProficiencies })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--gold)] text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
          Loading character sheet...
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fantasy-card p-8">
          <h1 className="text-2xl text-[var(--forest-green)] mb-4">Character Not Found</h1>
          <Link href="/dashboard" className="btn-gold">Return to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/dashboard" className="text-[var(--gold)] hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--gold)]">{character.name}</h1>
          <p className="text-[var(--parchment)]">
            Level {character.level} {character.race} {character.class}
            {character.background && ` • ${character.background}`}
          </p>
          <p className="text-sm text-[var(--parchment)]/70">
            Player: {character.user.username}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saving && <span className="text-[var(--gold)] text-sm">Saving...</span>}
          <Link href="/battlefield" className="btn-forest">Battle Map</Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="space-y-6">
          {/* Combat Stats */}
          <div className="fantasy-card p-4">
            <h3 className="text-lg text-[var(--forest-green)] mb-4">Combat</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-block">
                <div className="stat-label">AC</div>
                {canEdit ? (
                  <input
                    type="number"
                    value={character.armorClass}
                    onChange={e => updateCharacter({ armorClass: parseInt(e.target.value) || 0 })}
                    className="stat-value w-12 text-center bg-transparent border-none"
                  />
                ) : (
                  <div className="stat-value">{character.armorClass}</div>
                )}
              </div>
              <div className="stat-block">
                <div className="stat-label">Initiative</div>
                <div className="stat-value">{formatModifier(getModifier(character.dexterity))}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Speed</div>
                {canEdit ? (
                  <input
                    type="number"
                    value={character.speed}
                    onChange={e => updateCharacter({ speed: parseInt(e.target.value) || 0 })}
                    className="stat-value w-12 text-center bg-transparent border-none"
                  />
                ) : (
                  <div className="stat-value">{character.speed}</div>
                )}
                <div className="stat-modifier">ft</div>
              </div>
            </div>

            {/* HP */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[var(--stone-gray)]">Hit Points</span>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => updateCharacter({ hp: Math.max(0, character.hp - 1) })}
                        className="w-6 h-6 rounded bg-[var(--deep-red)] text-white text-sm font-bold"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateCharacter({ hp: Math.min(character.maxHp, character.hp + 1) })}
                        className="w-6 h-6 rounded bg-green-600 text-white text-sm font-bold"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="hp-bar">
                <div
                  className={`hp-fill ${getHPClass()}`}
                  style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-sm text-[var(--stone-gray)]">
                <span>
                  {canEdit ? (
                    <input
                      type="number"
                      value={character.hp}
                      onChange={e => updateCharacter({ hp: parseInt(e.target.value) || 0 })}
                      className="w-12 text-center bg-[var(--parchment)] border border-[var(--stone-gray)] rounded"
                    />
                  ) : (
                    character.hp
                  )}
                  {' / '}
                  {canEdit ? (
                    <input
                      type="number"
                      value={character.maxHp}
                      onChange={e => updateCharacter({ maxHp: parseInt(e.target.value) || 1 })}
                      className="w-12 text-center bg-[var(--parchment)] border border-[var(--stone-gray)] rounded"
                    />
                  ) : (
                    character.maxHp
                  )}
                </span>
                {character.tempHp > 0 && (
                  <span className="text-[var(--gold)]">+{character.tempHp} temp</span>
                )}
              </div>
            </div>

            {/* Proficiency Bonus */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--stone-gray)]">Proficiency Bonus</span>
              <div className="stat-block px-3 py-1">
                <div className="stat-value text-lg">{formatModifier(character.proficiencyBonus)}</div>
              </div>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="fantasy-card p-4">
            <h3 className="text-lg text-[var(--forest-green)] mb-4">Ability Scores</h3>
            <div className="grid grid-cols-2 gap-3">
              {ABILITIES.map(ability => (
                <StatBlock
                  key={ability}
                  label={ability.charAt(0).toUpperCase() + ability.slice(1, 3).toUpperCase()}
                  value={character[ability]}
                  onChange={canEdit ? (value) => updateCharacter({ [ability]: value }) : undefined}
                  editable={canEdit}
                />
              ))}
            </div>
          </div>

          {/* Saving Throws */}
          <div className="fantasy-card p-4">
            <h3 className="text-lg text-[var(--forest-green)] mb-4">Saving Throws</h3>
            <div className="space-y-2">
              {ABILITIES.map(ability => {
                const mod = getModifier(character[ability])
                const isProficient = character.savingThrowProficiencies.includes(ability)
                const totalMod = mod + (isProficient ? character.proficiencyBonus : 0)
                return (
                  <div key={ability} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSavingThrowProficiency(ability)}
                        disabled={!canEdit}
                        className={`w-4 h-4 rounded-full border-2 ${
                          isProficient ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--stone-gray)]'
                        } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                      />
                      <span className="text-sm text-[var(--stone-gray)] capitalize">{ability}</span>
                    </div>
                    <span className="font-bold text-[var(--forest-green)]">
                      {formatModifier(totalMod)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Middle Column - Skills */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="fantasy-card p-4">
            <h3 className="text-lg text-[var(--forest-green)] mb-4">Skills</h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {SKILLS.map(skill => {
                const isProficient = character.skillProficiencies.includes(skill.name)
                const mod = getSkillModifier(skill)
                return (
                  <div key={skill.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSkillProficiency(skill.name)}
                        disabled={!canEdit}
                        className={`w-4 h-4 rounded-full border-2 ${
                          isProficient ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-[var(--stone-gray)]'
                        } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                      />
                      <span className="text-sm text-[var(--stone-gray)]">
                        {skill.name}
                        <span className="text-xs text-[var(--stone-gray-light)] ml-1">
                          ({skill.ability.slice(0, 3)})
                        </span>
                      </span>
                    </div>
                    <span className="font-bold text-[var(--forest-green)]">
                      {formatModifier(mod)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Currency */}
          <div className="fantasy-card p-4">
            <h3 className="text-lg text-[var(--forest-green)] mb-4">Currency</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'copperPieces', label: 'CP', color: '#b87333' },
                { key: 'silverPieces', label: 'SP', color: '#c0c0c0' },
                { key: 'electrumPieces', label: 'EP', color: '#a8a8a8' },
                { key: 'goldPieces', label: 'GP', color: '#ffd700' },
                { key: 'platinumPieces', label: 'PP', color: '#e5e4e2' }
              ].map(currency => (
                <div key={currency.key} className="text-center">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: currency.color, color: '#333' }}
                  >
                    {currency.label}
                  </div>
                  {canEdit ? (
                    <input
                      type="number"
                      value={character[currency.key as keyof Character] as number}
                      onChange={e => updateCharacter({ [currency.key]: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-sm bg-[var(--parchment)] border border-[var(--stone-gray)] rounded"
                      min={0}
                    />
                  ) : (
                    <div className="text-sm text-[var(--stone-gray)]">
                      {String(character[currency.key as keyof Character])}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Inventory & Spells */}
        <div className="space-y-6">
          <Inventory
            items={character.inventory}
            characterId={character.id}
            editable={canEdit}
            onUpdate={fetchCharacter}
          />
          <SpellList
            spells={character.spells}
            characterId={character.id}
            editable={canEdit}
            onUpdate={fetchCharacter}
          />
        </div>
      </div>

      {/* Notes Section */}
      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'traits', label: 'Personality Traits' },
          { key: 'ideals', label: 'Ideals' },
          { key: 'bonds', label: 'Bonds' },
          { key: 'flaws', label: 'Flaws' }
        ].map(field => (
          <div key={field.key} className="fantasy-card p-4">
            <h3 className="text-sm font-bold text-[var(--forest-green)] mb-2">{field.label}</h3>
            {canEdit ? (
              <textarea
                value={(character[field.key as keyof Character] as string) || ''}
                onChange={e => updateCharacter({ [field.key]: e.target.value })}
                className="fantasy-input w-full h-24 text-sm"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <p className="text-sm text-[var(--stone-gray)] whitespace-pre-wrap">
                {(character[field.key as keyof Character] as string) || 'Not specified'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Features & Notes */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="fantasy-card p-4">
          <h3 className="text-lg text-[var(--forest-green)] mb-2">Features & Traits</h3>
          {canEdit ? (
            <textarea
              value={character.features || ''}
              onChange={e => updateCharacter({ features: e.target.value })}
              className="fantasy-input w-full h-32"
              placeholder="Enter features and traits..."
            />
          ) : (
            <p className="text-[var(--stone-gray)] whitespace-pre-wrap">
              {character.features || 'No features recorded'}
            </p>
          )}
        </div>
        <div className="fantasy-card p-4">
          <h3 className="text-lg text-[var(--forest-green)] mb-2">Notes</h3>
          {canEdit ? (
            <textarea
              value={character.notes || ''}
              onChange={e => updateCharacter({ notes: e.target.value })}
              className="fantasy-input w-full h-32"
              placeholder="Enter notes..."
            />
          ) : (
            <p className="text-[var(--stone-gray)] whitespace-pre-wrap">
              {character.notes || 'No notes'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
