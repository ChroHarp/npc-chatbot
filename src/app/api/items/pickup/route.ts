import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'

export async function POST(req: NextRequest) {
  const { teamCode, itemId, quantity = 1, uid } = await req.json()
  if (!teamCode || !itemId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const itemSnap = await getDoc(doc(db, 'items', itemId))
  if (!itemSnap.exists()) {
    return NextResponse.json({ error: 'item not found' }, { status: 404 })
  }
  const item = itemSnap.data()

  const teamRef = doc(db, 'teams', teamCode)
  const teamSnap = await getDoc(teamRef)
  if (!teamSnap.exists()) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 })
  }

  const inventory = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
  const current = inventory[itemId] ?? 0

  if (!item.stackable && current >= 1) {
    return NextResponse.json({ error: 'item not stackable' }, { status: 400 })
  }
  if (item.maxPerTeam != null && current + quantity > item.maxPerTeam) {
    return NextResponse.json({ error: 'max quantity reached' }, { status: 400 })
  }

  await updateDoc(teamRef, { [`inventory.${itemId}`]: increment(quantity) })
  await addDoc(collection(db, 'teams', teamCode, 'inventoryLog'), {
    itemId,
    action: 'pickup',
    quantity,
    uid: uid ?? null,
    timestamp: serverTimestamp(),
    source: 'api',
  })

  return NextResponse.json({ ok: true })
}
