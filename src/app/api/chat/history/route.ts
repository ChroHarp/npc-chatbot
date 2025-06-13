import { NextResponse } from 'next/server'
import { conversations } from '../store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('conversationId') || ''
  const messages = conversations.get(id) || []
  return NextResponse.json({ messages })
}
