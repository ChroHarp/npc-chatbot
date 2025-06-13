import { NextResponse } from 'next/server'
import { conversations } from '../store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('conversationId') || ''
  const convo = conversations.get(id)
  if (!convo) return new NextResponse('Not Found', { status: 404 })
  return NextResponse.json({ messages: convo.messages })
}
