import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(req: NextRequest) {
  const teamCode = req.nextUrl.searchParams.get('teamCode')
  if (!teamCode) {
    return NextResponse.json({ error: 'missing teamCode' }, { status: 400 })
  }

  const teamSnap = await getDoc(doc(db, 'teams', teamCode))
  if (!teamSnap.exists()) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 })
  }

  const inventory = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
  return NextResponse.json({ inventory })
}
