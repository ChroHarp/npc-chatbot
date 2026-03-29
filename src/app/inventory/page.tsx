'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useInventory } from '@/hooks/useInventory'
import { ItemCard } from '@/components/ItemCard'

export const dynamic = 'force-dynamic'

export default function InventoryPage() {
  const [teamCode, setTeamCode] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTeamCode(localStorage.getItem('teamCode'))
    setReady(true)
  }, [])

  const { inventory, loading } = useInventory(ready ? teamCode : null)

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gradient-to-b from-white to-teal-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">背包</h1>
        <Link href="/" className="text-sm text-gray-500 underline">
          返回
        </Link>
      </div>

      {ready && (
        teamCode ? (
          <p className="text-sm text-gray-500 mb-4">
            小隊 <span className="font-mono font-bold tracking-widest">{teamCode}</span>
          </p>
        ) : (
          <p className="text-sm text-red-500 mb-4">尚未加入小隊</p>
        )
      )}

      {loading ? (
        <p className="text-center text-gray-500 mt-8">載入中...</p>
      ) : inventory.length === 0 ? (
        <p className="text-center text-gray-400 mt-8">背包是空的</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {inventory.map((entry) => (
            <ItemCard key={entry.id} id={entry.id} item={entry.item} quantity={entry.quantity} />
          ))}
        </div>
      )}
    </div>
  )
}
