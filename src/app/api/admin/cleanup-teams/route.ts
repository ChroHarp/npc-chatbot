import { NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore'

export async function DELETE() {
  const now = Timestamp.now()
  const snap = await getDocs(
    query(collection(db, 'teams'), where('expireAt', '<', now)),
  )
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  return NextResponse.json({ deleted: snap.size })
}
