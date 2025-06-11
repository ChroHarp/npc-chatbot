'use client'

import { useEffect } from 'react'

export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="ml-auto h-full w-96 bg-white dark:bg-neutral-900 p-6 overflow-auto z-50">
        {children}
      </div>
    </div>
  )
}
