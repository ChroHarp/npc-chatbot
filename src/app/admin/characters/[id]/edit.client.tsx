'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { useParams, useRouter } from 'next/navigation'
import { doc, collection } from 'firebase/firestore'
import { useDocument, useCollection } from 'react-firebase-hooks/firestore'
import Image from 'next/image'
import { db } from '@/libs/firebase'
import { updateCharacter } from '../actions'
import { Rule, CharacterDoc, TaskDoc } from '@/types'

const MAX_FILE_SIZE = 3 * 1024 * 1024

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [value] = useDocument(id ? doc(db, 'characters', id) : undefined)
  const [taskValue] = useCollection(collection(db, 'tasks'))
  const data = value?.data() as CharacterDoc | undefined

  const [name, setName] = useState('')
  const [rules, setRules] = useState<Rule[]>([])
  const [keywordInputs, setKeywordInputs] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [avatarScale, setAvatarScale] = useState(1)
  const [avatarX, setAvatarX] = useState(0)
  const [avatarY, setAvatarY] = useState(0)
  const [tasks, setTasks] = useState<string[]>([])
  const [dragRule, setDragRule] = useState<number | null>(null)
  const [dragResponse, setDragResponse] = useState<{
    rule: number
    idx: number
  } | null>(null)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imageTargetRule, setImageTargetRule] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarEditing, setAvatarEditing] = useState(false)

  useEffect(() => {
    const d = value?.data() as CharacterDoc | undefined
    if (d) {
      setName(d.name)
      setAvatarScale(d.avatarScale ?? 1)
      setAvatarX(d.avatarX ?? 0)
      setAvatarY(d.avatarY ?? 0)
      setTasks(d.tasks || [])
      const raw = d.rules || []
      const first = raw.find((rr) => rr.type === 'firstLogin')
      const def = raw.find((rr) => rr.type === 'default')
      const others = raw.filter((rr) => rr.type !== 'firstLogin' && rr.type !== 'default')
      const r: Rule[] = [
        first ?? { keywords: [], responses: [], type: 'firstLogin' },
        def ?? { keywords: [], responses: [], type: 'default' },
        ...others,
      ]
      setRules(r)
      setKeywordInputs(r.map(() => ''))
    }
  }, [value])

  useEffect(() => {
    setKeywordInputs((inputs) => {
      const arr = [...inputs]
      while (arr.length < rules.length) arr.push('')
      return arr.slice(0, rules.length)
    })
  }, [rules.length])

  if (!value) return <div className="p-6">Loading...</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (file && file.size > MAX_FILE_SIZE) {
      setError('檔案大小不能超過 3MB')
      return
    }
    setLoading(true)
    try {
      await updateCharacter(
        id,
        name,
        rules,
        file ?? undefined,
        avatarScale,
        avatarX,
        avatarY,
        tasks,
      )
      router.push('/admin/characters')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadQr() {
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

  return (
    <div className="p-6 flex flex-col gap-4 max-w-md">
      <h1 className="text-xl">編輯角色</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          className="relative w-20 h-20 overflow-hidden rounded-full cursor-pointer"
          onClick={() => setAvatarEditing(true)}
        >
          <Image
            src={file ? URL.createObjectURL(file) : data?.avatarUrl || 'https://placehold.co/80x80.png'}
            alt={name}
            fill
            className="object-cover"
            style={{
              transform: `translate(${avatarX}%, ${avatarY}%) scale(${avatarScale})`,
            }}
          />
        </div>
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
          />
        </label>
        <label className="flex flex-col gap-1">
          所屬任務
          <select
            multiple
            className="border rounded px-2 py-1 h-28"
            value={tasks}
            onChange={(e) =>
              setTasks(
                Array.from(e.target.selectedOptions).map((o) => o.value)
              )
            }
          >
            {taskValue?.docs.map((doc) => {
              const d = doc.data() as TaskDoc
              return (
                <option key={doc.id} value={doc.id}>
                  {d.name}
                </option>
              )
            })}
          </select>
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex flex-col gap-4">
          {rules.map((rule, i) => (
            <div
              key={i}
              className="border p-2 rounded flex flex-col gap-2"
              draggable={i > 1 && !rule.type}
              onDragStart={() => setDragRule(i)}
              onDragOver={(e) => {
                if (dragRule !== null) e.preventDefault()
              }}
              onDrop={() => {
                if (dragRule === null || dragRule === i || i < 2) return
                if (dragRule < 2) return
                const arr = rules.slice(2)
                const from = dragRule - 2
                const to = i - 2
                arr.splice(to, 0, arr.splice(from, 1)[0])
                setRules([rules[0], rules[1], ...arr])
              }}
            >
              {i > 1 && !rule.type ? (
                <span className="text-xl cursor-move select-none">⋮⋮</span>
              ) : null}
              <div>
                <span className="font-medium">觸發關鍵詞 keywords</span>
                {rule.type === 'firstLogin' ? (
                  <div className="mt-1">
                    <span className="px-2 py-1 text-sm bg-gray-200 rounded">初次登入</span>
                  </div>
                ) : rule.type === 'default' ? (
                  <div className="mt-1">
                    <span className="px-2 py-1 text-sm bg-gray-200 rounded">default</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.keywords.map((kw, kidx) => (
                        <span
                          key={kidx}
                          className="px-2 py-1 text-sm bg-gray-200 rounded flex items-center gap-1"
                        >
                          {kw}
                          <button
                            type="button"
                            className="text-xs text-red-600"
                            onClick={() =>
                              setRules((r) =>
                                r.map((rr, ridx) =>
                                  ridx === i
                                    ? {
                                        ...rr,
                                        keywords: rr.keywords.filter((_, idx2) => idx2 !== kidx),
                                      }
                                    : rr,
                                ),
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <input
                        className="border rounded px-2 py-1 flex-1"
                        value={keywordInputs[i] ?? ''}
                        onChange={(e) =>
                          setKeywordInputs((ins) =>
                            ins.map((v, idx) => (idx === i ? e.target.value : v)),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="px-2 py-1 border rounded"
                        onClick={() => {
                          const kw = keywordInputs[i]?.trim()
                          if (!kw) return
                          setRules((r) =>
                            r.map((rr, idx) =>
                              idx === i
                                ? { ...rr, keywords: [...rr.keywords, kw] }
                                : rr,
                            ),
                          )
                          setKeywordInputs((ins) =>
                            ins.map((v, idx) => (idx === i ? '' : v)),
                          )
                        }}
                      >
                        新增
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-medium">回應內容 reply</span>
                {rule.responses.map((res, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2"
                    draggable
                    onDragStart={(e) => {
                      setDragResponse({ rule: i, idx: j })
                      setDragStartX(e.clientX)
                    }}
                    onDragOver={(e) => {
                      if (dragResponse) e.preventDefault()
                    }}
                    onDrop={() => {
                      if (!dragResponse || dragResponse.rule !== i) return
                      const from = dragResponse.idx
                      const to = j
                      if (from === to) return
                      setRules((r) =>
                        r.map((rr, idx) => {
                          if (idx !== i) return rr
                          const arr = [...rr.responses]
                          arr.splice(to, 0, arr.splice(from, 1)[0])
                          return { ...rr, responses: arr }
                        })
                      )
                      setDragResponse(null)
                      setDragStartX(null)
                    }}
                    onDragEnd={(e) => {
                      if (
                        dragResponse &&
                        dragResponse.rule === i &&
                        dragResponse.idx === j
                      ) {
                        if (e.dataTransfer?.dropEffect === 'none') {
                          if (
                            dragStartX !== null &&
                            Math.abs(e.clientX - dragStartX) > 30
                          ) {
                            if (confirm('確定要刪除此段回應嗎？')) {
                              setRules((r) =>
                                r.map((rr, idx) =>
                                  idx === i
                                    ? {
                                        ...rr,
                                        responses: rr.responses.filter((_, k) => k !== j),
                                      }
                                    : rr,
                                ),
                              )
                            }
                          }
                        }
                      }
                      setDragResponse(null)
                      setDragStartX(null)
                    }}
                  >
                    <span className="cursor-move select-none">⋮⋮</span>
                    {res.type === 'text' ? (
                      <input
                        className="border rounded px-2 py-1 flex-1"
                        value={res.value as string}
                        onChange={(e) => {
                          setRules((r) =>
                            r.map((rr, idx) => {
                              if (idx !== i) return rr
                              const responses = rr.responses.map((rs, k) =>
                                k === j ? { ...rs, value: e.target.value } : rs,
                              )
                              return { ...rr, responses }
                            }),
                          )
                        }}
                      />
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                        {typeof res.value === 'string' && res.value ? (
                          <Image
                            src={res.value}
                            alt="response"
                            width={128}
                            height={128}
                            className="object-contain w-32 h-32"
                          />
                        ) : null}
                        {typeof res.value !== 'string' && res.value ? (
                          <Image
                            src={URL.createObjectURL(res.value as File)}
                            alt="preview"
                            width={128}
                            height={128}
                            className="object-contain w-32 h-32"
                          />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > MAX_FILE_SIZE) {
                              alert('檔案大小不能超過 3MB')
                              e.target.value = ''
                              return
                            }
                            setRules((r) =>
                              r.map((rr, idx) => {
                                if (idx !== i) return rr
                                const responses = rr.responses.map((rs, k) =>
                                  k === j ? { ...rs, value: file } : rs,
                                )
                                return { ...rr, responses }
                              }),
                            )
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 text-sm border rounded"
                    onClick={() =>
                      setRules((r) =>
                        r.map((rr, idx) =>
                          idx === i
                            ? { ...rr, responses: [...rr.responses, { type: 'text', value: '' }] }
                            : rr,
                        ),
                      )
                    }
                  >
                    Add Text
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm border rounded"
                    onClick={() => {
                      setImageTargetRule(i)
                      fileInputRef.current?.click()
                    }}
                  >
                    Add Image
                  </button>
                </div>
                {rule.type ? null : (
                  <button
                    type="button"
                    className="text-red-600 text-sm self-start"
                    onClick={() => {
                      if (confirm('確定要刪除這條規則嗎？')) {
                        setRules((r) => r.filter((_, idx) => idx !== i))
                        setKeywordInputs((ins) => ins.filter((_, idx) => idx !== i))
                      }
                    }}
                  >
                    刪除規則
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="px-3 py-1 border rounded self-start"
            onClick={() => {
              setRules((r) => [...r, { keywords: [], responses: [] }])
              setKeywordInputs((ins) => [...ins, ''])
            }}
          >
            新增回應規則
          </button>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
            {loading ? '儲存中...' : '儲存'}
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => router.push('/admin/characters')}
          >
            取消
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={handleDownloadQr}
          >
            QR code
          </button>
        </div>
      </form>
      {avatarEditing ? (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded flex flex-col gap-2">
            <div className="relative w-64 h-64 overflow-hidden">
              <Image
                src={file ? URL.createObjectURL(file) : data?.avatarUrl || ''}
                alt="avatar"
                fill
                className="object-cover"
                style={{
                  transform: `translate(${avatarX}%, ${avatarY}%) scale(${avatarScale})`,
                }}
              />
            </div>
            <label className="text-sm">
              scale
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={avatarScale}
                onChange={(e) => setAvatarScale(Number(e.target.value))}
              />
            </label>
            <label className="text-sm">
              x
              <input
                type="range"
                min="-100"
                max="100"
                value={avatarX}
                onChange={(e) => setAvatarX(Number(e.target.value))}
              />
            </label>
            <label className="text-sm">
              y
              <input
                type="range"
                min="-100"
                max="100"
                value={avatarY}
                onChange={(e) => setAvatarY(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className="px-3 py-1 border rounded"
              onClick={() => setAvatarEditing(false)}
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (f.size > MAX_FILE_SIZE) {
            alert('檔案大小不能超過 3MB')
            e.target.value = ''
            return
          }
          if (imageTargetRule !== null) {
            setRules((r) =>
              r.map((rr, idx) =>
                idx === imageTargetRule
                  ? { ...rr, responses: [...rr.responses, { type: 'image', value: f }] }
                  : rr,
              ),
            )
          }
          setImageTargetRule(null)
          e.target.value = ''
        }}
      />
    </div>
  )
}
