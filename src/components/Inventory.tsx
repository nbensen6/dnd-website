'use client'

import { useState } from 'react'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  description?: string | null
  weight?: number | null
  equipped: boolean
}

interface InventoryProps {
  items: InventoryItem[]
  characterId: string
  editable: boolean
  onUpdate: () => void
}

export default function Inventory({ items, characterId, editable, onUpdate }: InventoryProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, description: '', weight: 0 })

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch(`/api/characters/${characterId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })
      setNewItem({ name: '', quantity: 1, description: '', weight: 0 })
      setShowAdd(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      await fetch(`/api/characters/${characterId}/inventory/${itemId}`, {
        method: 'DELETE'
      })
      onUpdate()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const toggleEquipped = async (item: InventoryItem) => {
    try {
      await fetch(`/api/characters/${characterId}/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipped: !item.equipped })
      })
      onUpdate()
    } catch (error) {
      console.error('Error toggling equipped:', error)
    }
  }

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)

  return (
    <div className="fantasy-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-[var(--forest-green)]">Inventory</h3>
        <div className="text-sm text-[var(--stone-gray)]">
          Total Weight: {totalWeight.toFixed(1)} lb
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[var(--stone-gray-light)] text-center py-4">
          No items in inventory
        </p>
      ) : (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded ${
                item.equipped ? 'bg-[var(--gold)]/20' : 'bg-[var(--parchment-dark)]'
              }`}
            >
              <div className="flex items-center gap-3">
                {editable && (
                  <button
                    onClick={() => toggleEquipped(item)}
                    className={`w-5 h-5 rounded border-2 ${
                      item.equipped
                        ? 'bg-[var(--gold)] border-[var(--gold)]'
                        : 'border-[var(--stone-gray)]'
                    }`}
                    title={item.equipped ? 'Unequip' : 'Equip'}
                  >
                    {item.equipped && (
                      <svg className="w-full h-full text-[var(--forest-green)]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
                <div>
                  <span className="font-medium text-[var(--stone-gray)]">
                    {item.name} {item.quantity > 1 && `(×${item.quantity})`}
                  </span>
                  {item.description && (
                    <p className="text-xs text-[var(--stone-gray-light)]">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.weight && (
                  <span className="text-xs text-[var(--stone-gray-light)]">
                    {(item.weight * item.quantity).toFixed(1)} lb
                  </span>
                )}
                {editable && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[var(--deep-red)] hover:text-[var(--deep-red-light)] text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editable && (
        <>
          {showAdd ? (
            <form onSubmit={addItem} className="space-y-3 border-t border-[var(--stone-gray)] pt-4">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="fantasy-input text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  className="fantasy-input text-sm"
                  min={1}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="fantasy-input text-sm"
                />
                <input
                  type="number"
                  placeholder="Weight (lb)"
                  value={newItem.weight || ''}
                  onChange={e => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                  className="fantasy-input text-sm"
                  step="0.1"
                  min={0}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-gold text-sm flex-1">Add</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-forest text-sm flex-1">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAdd(true)} className="btn-forest w-full text-sm">
              + Add Item
            </button>
          )}
        </>
      )}
    </div>
  )
}
