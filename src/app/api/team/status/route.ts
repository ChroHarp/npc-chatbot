import { NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamCode = searchParams.get('teamCode') || ''
  if (!teamCode) return new NextResponse('Bad Request', { status: 400 })

  const snap = await getDoc(doc(db, 'teams', teamCode))
  if (!snap.exists()) return new NextResponse('Not Found', { status: 404 })

  return NextResponse.json({ teamCode, ...snap.data() })
}
