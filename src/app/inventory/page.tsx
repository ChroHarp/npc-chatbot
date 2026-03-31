'use client'
import { Suspense, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInventory, InventoryEntry } from '@/hooks/useInventory'
import { ItemCard } from '@/components/ItemCard'

export const dynamic = 'force-dynamic'

function UseItemModal({
  entry,
  fromCharId,
  onClose,
}: {
  entry: InventoryEntry
  fromCharId: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const { item } = entry

  function handleUse() {
    if (!fromCharId) {
      alert('請先進入角色對話再使用物品')
      return
    }
    router.push(`/chat/${fromCharId}?useItem=${entry.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
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
        {!fromCharId && (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
            請先進入角色對話再使用物品
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleUse}
            disabled={!fromCharId}
            className="flex-1 py-3 bg-black text-white rounded-xl font-medium disabled:opacity-40"
          >
            使用
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl font-medium text-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

function InventoryPageContent() {
  const searchParams = useSearchParams()
  const fromCharId = searchParams.get('from')

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
        <Link
          href={fromCharId ? `/chat/${fromCharId}` : '/'}
          className="text-sm text-gray-500 underline"
        >
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

      {selected && (
        <UseItemModal
          entry={selected}
          fromCharId={fromCharId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export default function InventoryPage() {
  return <Suspense><InventoryPageContent /></Suspense>
}
