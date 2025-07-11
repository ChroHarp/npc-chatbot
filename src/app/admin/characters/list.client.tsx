'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { createCharacter, deleteCharacter, reorderCharacters } from './actions'
import QRCode from 'qrcode'
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
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const characters =
    value?.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as CharacterDoc),
      }))
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) || []

  async function handleDownloadQr(id: string, name: string) {
    const url = `${window.location.origin}/chat/${id}`
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 450 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${name || 'QR'}QrCode.png`
      link.click()
    } catch {
      alert('Failed to generate QR code')
    }
  }

  const columns: Column<(typeof characters)[number]>[] = [
    {
      header: '',
      accessor: () => <span className="cursor-move">☰</span>,
      widthClassName: 'w-4',
    },
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
        <Link href={`/chat/${row.id}`} className="text-blue-500 underline">
          聊天
        </Link>
      ),
    },
    {
      header: '',
      accessor: (row) => (
        <button
          className="text-blue-500 underline"
          onClick={() => handleDownloadQr(row.id, row.name)}
        >
          下載QR
        </button>
      ),
    },
    {
      header: '',
      accessor: (row) => (
        <Link href={`/admin/characters/${row.id}`} className="text-blue-500 underline">
          編輯
        </Link>
      ),
    },
    {
      header: '',
      accessor: (row) => (
        <button
          className="text-red-600 underline"
          onClick={async () => {
            if (confirm('確定要刪除這個角色嗎？')) {
              await deleteCharacter(row.id)
            }
          }}
        >
          刪除
        </button>
      ),
    },
  ]

  function rowProps(_row: (typeof characters)[number], idx: number) {
    return {
      draggable: true,
      onDragStart: () => setDragIdx(idx),
      onDragOver: (e: React.DragEvent) => {
        if (dragIdx !== null) e.preventDefault()
      },
      onDrop: async () => {
        if (dragIdx === null || dragIdx === idx) {
          setDragIdx(null)
          return
        }
        const ids = characters.map((c) => c.id)
        const [moved] = ids.splice(dragIdx, 1)
        ids.splice(idx, 0, moved)
        setDragIdx(null)
        await reorderCharacters(ids)
      },
    }
  }

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setDrawerOpen(true)}
        >
          新增角色
        </button>
      </div>

      <DataTable columns={columns} data={characters} rowProps={rowProps} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <h2 className="text-xl mb-4">新增角色</h2>
        <NewCharacterForm onCreated={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}

