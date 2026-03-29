import { NextResponse } from 'next/server'
import { getMessages, getConversation } from '../store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('conversationId') || ''
  const convo = await getConversation(id)
  if (!convo) return new NextResponse('Not Found', { status: 404 })
  const messages = await getMessages(id)
  return NextResponse.json({ messages })
}
