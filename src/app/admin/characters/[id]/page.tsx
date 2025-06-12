'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import Image from 'next/image'
import { db } from '@/libs/firebase'
import { updateCharacter } from '../actions'

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [value] = useDocument(id ? doc(db, 'characters', id) : undefined)
  const data = value?.data() as { name: string; avatarUrl: string; description: string } | undefined

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (data) {
      setName(data.name)
      setDescription(data.description)
    }
  }, [data])

  if (!data) return <div className="p-6">Loading...</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await updateCharacter(id, name, description, file ?? undefined)
    setLoading(false)
    router.push('/admin/characters')
  }

  return (
    <div className="p-6 flex flex-col gap-4 max-w-md">
      <h1 className="text-xl">編輯角色</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Image
          src={file ? URL.createObjectURL(file) : data.avatarUrl || 'https://placehold.co/80x80.png'}
          alt={name}
          width={80}
          height={80}
          className="rounded-full object-cover w-20 h-20"
        />
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
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="flex flex-col gap-1">
          對話規則
          <textarea
            className="border rounded px-2 py-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>
        <button type="submit" disabled={loading} className="self-start px-4 py-2 bg-black text-white rounded disabled:opacity-50">
          {loading ? '儲存中...' : '儲存'}
        </button>
      </form>
    </div>
  )
}
