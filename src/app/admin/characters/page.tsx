'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { createCharacter } from './actions'
import { DataTable, Column } from '@/components/data-table'
import { Drawer } from '@/components/drawer'


function NewCharacterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    await createCharacter(name, file)
    setLoading(false)
    onCreated()
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
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </label>
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

  const characters = value?.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { name: string; avatarUrl: string; description: string })
  })) || []

  const columns: Column<(typeof characters)[number]>[] = [
    {
      header: 'Avatar',
      accessor: (row) => (
        <Image
          src={row.avatarUrl}
          alt={row.name}
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
      ),
    },
    { header: 'Name', accessor: (row) => row.name },
    { header: 'Description', accessor: (row) => row.description },
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

