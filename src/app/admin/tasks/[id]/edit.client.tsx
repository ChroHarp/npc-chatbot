'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, collection } from 'firebase/firestore'
import { useDocument, useCollection } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import { updateTask, deleteTask } from '../actions'
import type { TaskDoc, CharacterDoc } from '@/types'
import Image from 'next/image'
import QRCode from 'qrcode'
import Link from 'next/link'

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [taskSnap] = useDocument(id ? doc(db, 'tasks', id) : undefined)
  const [charSnap] = useCollection(collection(db, 'characters'))
  const task = taskSnap?.data() as TaskDoc | undefined
  const characters = charSnap?.docs.map(d => ({ id: d.id, data: d.data() as CharacterDoc })) || []

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setName(task.name)
      setDesc(task.description || '')
    }
  }, [task])
  useEffect(() => {
    if (charSnap) {
      const ids = charSnap.docs.filter(d => (d.data().tasks || []).includes(id!)).map(d => d.id)
      setSelected(ids)
    }
  }, [charSnap, id])

  if (!taskSnap) return <div className="p-6">Loading...</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateTask(id!, name, desc, selected)
      router.push('/admin/tasks')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這個任務嗎？')) return
    await deleteTask(id!)
    router.push('/admin/tasks')
  }

  async function handleDownloadQr(cid: string, cname: string) {
    const url = `${window.location.origin}/chat/${cid}`
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 450 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${cname || 'QR'}QrCode.png`
      link.click()
    } catch {
      alert('Failed to generate QR code')
    }
  }

  return (
    <div className="p-6 flex flex-col gap-4 max-w-md">
      <h1 className="text-xl">編輯任務</h1>
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
          人物
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
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">儲存</button>
          <button type="button" onClick={handleDelete} className="px-4 py-2 text-red-600">刪除</button>
        </div>
      </form>
      <h2 className="text-lg mt-4">人物列表</h2>
      <div className="flex flex-col gap-2">
        {characters.filter(ch => selected.includes(ch.id)).map(ch => (
          <div key={ch.id} className="flex items-center gap-2">
            <div className="relative w-10 h-10 overflow-hidden rounded-full">
              <Image src={ch.data.avatarUrl || 'https://placehold.co/40x40.png'} alt={ch.data.name} fill className="object-cover" style={{transform:`translate(${ch.data.avatarX??0}%,${ch.data.avatarY??0}%) scale(${ch.data.avatarScale??1})`}} />
            </div>
            <span className="flex-1">{ch.data.name}</span>
            <Link href={`/admin/characters/${ch.id}`} className="text-blue-500 underline">編輯</Link>
            <Link href={`/chat/${ch.id}`} className="text-blue-500 underline">聊天</Link>
            <button className="text-blue-500 underline" onClick={()=>handleDownloadQr(ch.id, ch.data.name)}>下載QR</button>
          </div>
        ))}
      </div>
    </div>
  )
}
