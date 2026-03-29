'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { DataTable, Column } from '@/components/data-table'
import { Drawer } from '@/components/drawer'
import { createItem, deleteItem } from './actions'
import type { ItemDoc } from '@/types'

type ItemRow = ItemDoc & { id: string }

const MAX_FILE_SIZE = 3 * 1024 * 1024

function NewItemForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [stackable, setStackable] = useState(true)
  const [maxPerTeam, setMaxPerTeam] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createItem(
        {
          name,
          description: description || undefined,
          category: category || undefined,
          stackable,
          maxPerTeam: maxPerTeam ? Number(maxPerTeam) : undefined,
        },
        file ?? undefined,
      )
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        名稱
        <input
          className="border rounded px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        說明
        <textarea
          className="border rounded px-2 py-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        分類
        <input
          className="border rounded px-2 py-1"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="選填"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={stackable}
          onChange={(e) => setStackable(e.target.checked)}
        />
        可疊加
      </label>
      <label className="flex flex-col gap-1">
        每隊上限
        <input
          type="number"
          min="1"
          className="border rounded px-2 py-1 w-24"
          value={maxPerTeam}
          onChange={(e) => setMaxPerTeam(e.target.value)}
          placeholder="不限"
        />
      </label>
      <label className="flex flex-col gap-1">
        圖片
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            if (f && f.size > MAX_FILE_SIZE) {
              alert('檔案大小不能超過 3MB')
              e.target.value = ''
              setFile(null)
              return
            }
            setFile(f)
          }}
        />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? '建立中...' : '建立'}
      </button>
    </form>
  )
}

export default function ItemsListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [snap] = useCollection(query(collection(db, 'items'), orderBy('order', 'asc')))

  const items: ItemRow[] = snap?.docs.map((d) => ({ id: d.id, ...(d.data() as ItemDoc) })) || []

  const columns: Column<ItemRow>[] = [
    {
      header: '圖片',
      accessor: (row) =>
        row.imageUrl ? (
          <div className="relative w-10 h-10 overflow-hidden rounded">
            <Image
              src={row.imageUrl}
              alt={row.name}
              fill
              className="object-cover"
              style={{
                transform: `translate(${row.imageX ?? 0}%, ${row.imageY ?? 0}%) scale(${row.imageScale ?? 1})`,
              }}
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            ?
          </div>
        ),
      widthClassName: 'w-16',
    },
    { header: '名稱', accessor: (row) => row.name },
    { header: '分類', accessor: (row) => row.category || '—', widthClassName: 'w-24' },
    {
      header: '可疊加',
      accessor: (row) => (row.stackable ? '是' : '否'),
      widthClassName: 'w-20',
    },
    {
      header: '上限',
      accessor: (row) => (row.maxPerTeam != null ? String(row.maxPerTeam) : '—'),
      widthClassName: 'w-16',
    },
    {
      header: '',
      accessor: (row) => (
        <Link href={`/admin/items/${row.id}`} className="text-blue-500 underline">
          編輯
        </Link>
      ),
      widthClassName: 'w-16',
    },
    {
      header: '',
      accessor: (row) => (
        <button
          className="text-red-600 underline"
          onClick={async () => {
            if (confirm(`確定要刪除「${row.name}」？`)) await deleteItem(row.id)
          }}
        >
          刪除
        </button>
      ),
      widthClassName: 'w-16',
    },
  ]

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setDrawerOpen(true)}
        >
          新增物件
        </button>
      </div>
      <DataTable columns={columns} data={items} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <h2 className="text-xl mb-4">新增物件</h2>
        <NewItemForm onCreated={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}
