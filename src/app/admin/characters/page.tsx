'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { createCharacter } from './actions'
import { DataTable, Column } from '@/components/data-table'
import { Drawer } from '@/components/drawer'
import { CharacterDoc } from '@/types'


const MAX_FILE_SIZE = 3 * 1024 * 1024

function NewCharacterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError('檔案大小不能超過 3MB')
      return
    }
    setLoading(true)
    try {
      await createCharacter(name, file)
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
        Avatar
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
          required
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

export default function CharactersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [value] = useCollection(collection(db, 'characters'))

  const characters =
    value?.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as CharacterDoc)
    })) || []

  const columns: Column<(typeof characters)[number]>[] = [
    {
      header: 'Avatar',
      accessor: (row) => (
        <div className="relative w-10 h-10 overflow-hidden rounded-full">
          <Image
            src={row.avatarUrl || 'https://placehold.co/40x40.png'}
            alt={row.name}
            fill
            className="object-cover"
            style={{
              transform: `translate(${row.avatarX ?? 0}%, ${row.avatarY ?? 0}%) scale(${row.avatarScale ?? 1})`,
            }}
          />
        </div>
      ),
    },
    { header: 'Name', accessor: (row) => row.name },
    { header: 'Rules', accessor: (row) => String(row.rules?.length ?? 0) },
    {
      header: '',
      accessor: (row) => (
        <Link href={`/admin/characters/${row.id}`} className="text-blue-500 underline">
          編輯
        </Link>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setDrawerOpen(true)}
        >
          新增角色
        </button>
      </div>

      <DataTable columns={columns} data={characters} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <h2 className="text-xl mb-4">新增角色</h2>
        <NewCharacterForm onCreated={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}

