'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ChatMessage } from '@/types/chat'

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const [showImage, setShowImage] = useState(false)

  function renderContent() {
    switch (message.type) {
      case 'IMAGE':
        return (
          <>
            <Image
              src={message.content}
              alt="image"
              width={200}
              height={200}
              className="rounded-lg cursor-pointer"
              onClick={() => setShowImage(true)}
              unoptimized
            />
            {showImage && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                onClick={() => setShowImage(false)}
              >
                <div
                  className="relative max-w-full max-h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-2 right-2 text-white text-2xl z-10"
                    onClick={() => setShowImage(false)}
                  >
                    ×
                  </button>
                  <TransformWrapper>
                    <TransformComponent wrapperClass="max-h-screen max-w-screen">
                      <img
                        src={message.content}
                        alt="image"
                        className="max-h-screen max-w-screen"
                      />
                    </TransformComponent>
                  </TransformWrapper>
                </div>
              </div>
            )}
          </>
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 mb-3 float-in`}>
      {!isUser && message.avatarUrl && (
        <div className="relative w-8 h-8 overflow-hidden rounded-full self-end flex-shrink-0">
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
        <div
          className={`px-4 py-3 rounded-xl shadow text-sm break-words ${
            isUser
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800'
              : 'bg-gradient-to-br from-green-50 to-green-100 text-gray-800'
          } ${message.typing ? 'animate-pulse' : ''}`}
        >
          {message.typing ? <span className="tracking-widest">...</span> : renderContent()}
        </div>
        {message.timestamp && !message.typing && (
          <time className="block mt-1 text-xs text-gray-500 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
    </div>
  )
}
