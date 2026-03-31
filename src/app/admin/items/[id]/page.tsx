'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import type { ItemDoc } from '@/types'
import { updateItem } from '../actions'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 3 * 1024 * 1024

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [snap, loading] = useDocument(doc(db, 'items', id))
  const item = snap?.data() as ItemDoc | undefined

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [stackable, setStackable] = useState(true)
  const [maxPerTeam, setMaxPerTeam] = useState('')
  const [imageScale, setImageScale] = useState(1)
  const [imageX, setImageX] = useState(0)
  const [imageY, setImageY] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!snap?.exists()) return
    const d = snap.data() as ItemDoc
    setName(d.name)
    setDescription(d.description ?? '')
    setCategory(d.category ?? '')
    setStackable(d.stackable)
    setMaxPerTeam(d.maxPerTeam != null ? String(d.maxPerTeam) : '')
    setImageScale(d.imageScale ?? 1)
    setImageX(d.imageX ?? 0)
    setImageY(d.imageY ?? 0)
  }, [snap])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateItem(
        id,
        {
          name,
          description: description || undefined,
          category: category || undefined,
          stackable,
          maxPerTeam: maxPerTeam ? Number(maxPerTeam) : undefined,
          imageScale,
          imageX,
          imageY,
        },
        file ?? undefined,
      )
      router.push('/admin/items')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const displayUrl = previewUrl ?? item?.imageUrl ?? null

  if (loading) return <div className="p-6">載入中...</div>
  if (!item) return <div className="p-6 text-red-600">找不到此物件</div>

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">編輯物件</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 underline">
          返回
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">圖片</p>
          {displayUrl && (
            <div className="relative w-32 h-32 overflow-hidden rounded border">
              <Image
                src={displayUrl}
                alt={name}
                fill
                className="object-cover"
                style={{
                  transform: `translate(${imageX}%, ${imageY}%) scale(${imageScale})`,
                }}
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f && f.size > MAX_FILE_SIZE) {
                alert('檔案大小不能超過 3MB')
                e.target.value = ''
                return
              }
              setFile(f)
              setPreviewUrl(f ? URL.createObjectURL(f) : null)
            }}
          />
          {displayUrl && (
            <div className="flex flex-col gap-2 p-3 border rounded bg-gray-50">
              <p className="text-sm font-medium text-gray-700">圖片調整</p>
              <label className="flex items-center gap-2 text-sm">
                縮放
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right">{imageScale.toFixed(2)}x</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                X
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={imageX}
                  onChange={(e) => setImageX(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right">{imageX}%</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                Y
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={imageY}
                  onChange={(e) => setImageY(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right">{imageY}%</span>
              </label>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 self-start"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>
      </form>
    </div>
  )
}
