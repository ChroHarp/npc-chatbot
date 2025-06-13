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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 mb-3`}>
      {!isUser && (
        <Image
          src={message.avatarUrl || '/next.svg'}
          alt="avatar"
          width={32}
          height={32}
          className="rounded-full self-end"
        />
      )}
      <div className="max-w-[70%]">
        <div
          className={`px-3 py-2 rounded-lg text-sm break-words ${
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-neutral-800'
          }`}
        >
          {renderContent()}
        </div>
        {message.timestamp && (
          <time className="block mt-1 text-xs text-gray-500 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
    </div>
  )
}
