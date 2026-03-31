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
  deleteField,
} from 'firebase/firestore'

export async function POST(req: NextRequest) {
  const { teamCode, itemId, quantity = 1, uid } = await req.json()
  if (!teamCode || !itemId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const teamRef = doc(db, 'teams', teamCode)
  const teamSnap = await getDoc(teamRef)
  if (!teamSnap.exists()) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 })
  }

  const inventory = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
  const current = inventory[itemId] ?? 0
  if (current < quantity) {
    return NextResponse.json({ error: 'insufficient quantity' }, { status: 400 })
  }

  const newQty = current - quantity
  if (newQty === 0) {
    await updateDoc(teamRef, { [`inventory.${itemId}`]: deleteField() })
  } else {
    await updateDoc(teamRef, { [`inventory.${itemId}`]: increment(-quantity) })
  }

  await addDoc(collection(db, 'teams', teamCode, 'inventoryLog'), {
    itemId,
    action: 'use',
    quantity,
    uid: uid ?? null,
    timestamp: serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
