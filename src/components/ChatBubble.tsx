'use client'
import Image from 'next/image'
import React from 'react'
import type { ChatMessage } from '@/types/chat'

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  function renderContent() {
    switch (message.type) {
      case 'IMAGE':
        return (
          <Image
            src={message.content}
            alt="image"
            width={200}
            height={200}
            className="rounded-lg"
            unoptimized
          />
        )
      case 'YOUTUBE':
        const id = message.content.split('v=')[1] || message.content
        return (
          <div className="relative w-64 sm:w-80 pt-[56.25%]">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              className="absolute inset-0 w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        )
      default:
        return <span>{message.content}</span>
    }
  }

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--npc'}`}> 
      {!isUser && message.avatarUrl && (
        <div className="chat-bubble__avatar">
          <Image
            src={message.avatarUrl}
            alt="avatar"
            fill
            className="object-cover"
            style={{
              transform: `translate(${message.avatarX ?? 0}%, ${message.avatarY ?? 0}%) scale(${message.avatarScale ?? 1})`,
            }}
            unoptimized
          />
        </div>
      )}
      <div className="max-w-[70%]">
        <div className="chat-bubble__content">
          {renderContent()}
        </div>
        {message.timestamp && (
          <time className="chat-bubble__time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
    </div>
  )
}
