'use client'
import { useState, useEffect } from 'react'
import { doc, onSnapshot, collection } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import type { ItemDoc } from '@/types'

export interface InventoryEntry {
  id: string
  item: ItemDoc
  quantity: number
}

export function useInventory(teamCode: string | null) {
  const [teamInv, setTeamInv] = useState<Record<string, number>>({})
  const [itemDefs, setItemDefs] = useState<Record<string, ItemDoc>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamCode) {
      setTeamInv({})
      setLoading(false)
      return
    }
    return onSnapshot(doc(db, 'teams', teamCode), (snap) => {
      setTeamInv((snap.data()?.inventory ?? {}) as Record<string, number>)
      setLoading(false)
    })
  }, [teamCode])

  useEffect(() => {
    return onSnapshot(collection(db, 'items'), (snap) => {
      const defs: Record<string, ItemDoc> = {}
      snap.docs.forEach((d) => {
        defs[d.id] = d.data() as ItemDoc
      })
      setItemDefs(defs)
    })
  }, [])

  const inventory: InventoryEntry[] = Object.entries(teamInv)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ id, item: itemDefs[id], quantity: qty }))
    .filter((e) => e.item != null)

  return { inventory, loading }
}
