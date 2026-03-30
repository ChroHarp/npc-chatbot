'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInventory, InventoryEntry } from '@/hooks/useInventory'
import { ItemCard } from '@/components/ItemCard'

export const dynamic = 'force-dynamic'

function UseItemModal({
  entry,
  teamCode,
  onClose,
}: {
  entry: InventoryEntry
  teamCode: string
  onClose: () => void
}) {
  const [using, setUsing] = useState(false)
  const [usedName, setUsedName] = useState<string | null>(null)

  async function handleUse() {
    setUsing(true)
    try {
      const res = await fetch('/api/items/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCode, itemId: entry.id, quantity: 1 }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '使用失敗')
        return
      }
      setUsedName(entry.item.name)
      setTimeout(onClose, 1500)
    } catch {
      alert('使用失敗')
    } finally {
      setUsing(false)
    }
  }

  const { item } = entry

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {usedName ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-3xl">✅</span>
            <p className="text-lg font-semibold">使用了「{usedName}」</p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 items-start">
              {item.imageUrl ? (
                <div className="relative w-20 h-20 overflow-hidden rounded flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    style={{
                      transform: `translate(${item.imageX ?? 0}%, ${item.imageY ?? 0}%) scale(${item.imageScale ?? 1})`,
                    }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-3xl flex-shrink-0">
                  ?
                </div>
              )}
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-lg">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
                <p className="text-xs text-gray-400">持有數量：{entry.quantity}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUse}
                disabled={using}
                className="flex-1 py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50"
              >
                {using ? '使用中...' : '使用'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 border rounded-xl font-medium text-gray-600"
              >
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [teamCode, setTeamCode] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<InventoryEntry | null>(null)

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
            <ItemCard
              key={entry.id}
              id={entry.id}
              item={entry.item}
              quantity={entry.quantity}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>
      )}

      {selected && teamCode && (
        <UseItemModal
          entry={selected}
          teamCode={teamCode}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
