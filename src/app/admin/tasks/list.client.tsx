'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { DataTable, Column } from '@/components/data-table'
import { Drawer } from '@/components/drawer'
import Link from 'next/link'
import Image from 'next/image'
import { createTask, deleteTask } from './actions'
import type { TaskDoc, CharacterDoc } from '@/types'

function NewTaskForm({ characters, onCreated }: { characters: {id: string, data: CharacterDoc}[], onCreated: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createTask(name, desc, selected)
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
        任務名稱
        <input className="border rounded px-2 py-1" value={name} onChange={(e)=>setName(e.target.value)} required />
      </label>
      <label className="flex flex-col gap-1">
        任務說明
        <textarea className="border rounded px-2 py-1" value={desc} onChange={(e)=>setDesc(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        加入人物
        <div className="border rounded px-2 py-1 max-h-40 overflow-auto flex flex-col gap-1">
          {characters.map(ch => (
            <label key={ch.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="mr-1"
                value={ch.id}
                checked={selected.includes(ch.id)}
                onChange={e => {
                  const val = ch.id
                  setSelected(arr =>
                    e.target.checked ? [...arr, val] : arr.filter(id => id !== val)
                  )
                }}
              />
              <div className="relative w-6 h-6 overflow-hidden rounded-full">
                <Image
                  src={ch.data.avatarUrl || 'https://placehold.co/24x24.png'}
                  alt={ch.data.name}
                  fill
                  className="object-cover"
                  style={{
                    transform: `translate(${ch.data.avatarX ?? 0}%,${ch.data.avatarY ?? 0}%) scale(${ch.data.avatarScale ?? 1})`
                  }}
                />
              </div>
              <span>{ch.data.name}</span>
            </label>
          ))}
        </div>
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="self-start px-4 py-2 bg-black text-white rounded disabled:opacity-50">
        {loading ? '建立中...' : '建立'}
      </button>
    </form>
  )
}

export default function TasksPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [taskSnap] = useCollection(query(collection(db,'tasks'), orderBy('createdAt','desc')))
  const [charSnap] = useCollection(collection(db,'characters'))

  const tasks = taskSnap?.docs.map(doc => ({ id: doc.id, ...(doc.data() as TaskDoc) })) || []
  const characters = charSnap?.docs.map(doc => ({ id: doc.id, data: doc.data() as CharacterDoc })) || []

  const columns: Column<(typeof tasks)[number]>[] = [
    { header: 'Name', accessor: row => row.name },
    { header: 'Description', accessor: row => row.description || '' },
    { header: '', accessor: row => (
        <Link href={`/admin/tasks/${row.id}`} className="text-blue-500 underline">管理</Link>
      ) },
    { header: '', accessor: row => (
        <button className="text-red-600 underline" onClick={async ()=>{ if(confirm('確定要刪除這個任務嗎？')) await deleteTask(row.id) }}>刪除</button>
      )},
  ]

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button className="px-4 py-2 bg-black text-white rounded" onClick={()=>setDrawerOpen(true)}>新增任務</button>
      </div>
      <DataTable columns={columns} data={tasks} />
      <Drawer open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        <h2 className="text-xl mb-4">新增任務</h2>
        <NewTaskForm characters={characters} onCreated={()=>setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}
