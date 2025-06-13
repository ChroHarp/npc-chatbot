'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import Image from 'next/image'
import { db } from '@/libs/firebase'
import { updateCharacter } from '../actions'
import { Rule, CharacterDoc } from '@/types'

const MAX_FILE_SIZE = 3 * 1024 * 1024

export default function EditCharacterPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [value] = useDocument(id ? doc(db, 'characters', id) : undefined)
  const data = value?.data() as CharacterDoc | undefined

  const [name, setName] = useState('')
  const [rules, setRules] = useState<Rule[]>([])
  const [keywordInputs, setKeywordInputs] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<{ rule: number; idx: number } | null>(null)

  const editingItem =
    editing && rules[editing.rule]?.responses[editing.idx]?.type === 'image'
      ? rules[editing.rule].responses[editing.idx]
      : null
  const editingSrc = editingItem
    ? typeof editingItem.value === 'string'
      ? editingItem.value
      : URL.createObjectURL(editingItem.value as File)
    : ''
  const editingScale = editingItem?.scale ?? 1
  const editingX = editingItem?.x ?? 0
  const editingY = editingItem?.y ?? 0

  useEffect(() => {
    const d = value?.data() as CharacterDoc | undefined
    if (d) {
      setName(d.name)
      const r = d.rules || [{ keywords: [], responses: [] }]
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
      await updateCharacter(id, name, rules, file ?? undefined)
      router.push('/admin/characters')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-4 max-w-md">
      <h1 className="text-xl">編輯角色</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Image
          src={file ? URL.createObjectURL(file) : data?.avatarUrl || 'https://placehold.co/80x80.png'}
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
        <div className="flex flex-col gap-4">
          {rules.map((rule, i) => (
            <div key={i} className="border p-2 rounded flex flex-col gap-2">
              <div>
                <span className="font-medium">觸發關鍵詞 keywords</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rule.keywords.map((kw, kidx) => (
                    <span
                      key={kidx}
                      className="px-2 py-1 text-sm bg-gray-200 rounded"
                    >
                      {kw}
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
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-medium">回應內容 reply</span>
                {rule.responses.map((res, j) => (
                  <div key={j} className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
                        {typeof res.value === 'string' && res.value ? (
                          <Image
                            src={res.value}
                            alt="response"
                            width={40}
                            height={40}
                            className="object-cover w-10 h-10 rounded cursor-pointer"
                            style={{
                              objectPosition: `${res.x ?? 0}% ${res.y ?? 0}%`,
                              transform: `scale(${res.scale ?? 1})`,
                            }}
                            onClick={() => setEditing({ rule: i, idx: j })}
                          />
                        ) : null}
                        {typeof res.value !== 'string' && res.value ? (
                          <Image
                            src={URL.createObjectURL(res.value as File)}
                            alt="preview"
                            width={40}
                            height={40}
                            className="object-cover w-10 h-10 rounded cursor-pointer"
                            style={{
                              objectPosition: `${res.x ?? 0}% ${res.y ?? 0}%`,
                              transform: `scale(${res.scale ?? 1})`,
                            }}
                            onClick={() => setEditing({ rule: i, idx: j })}
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
                    onClick={() =>
                      setRules((r) =>
                        r.map((rr, idx) =>
                          idx === i
                            ? { ...rr, responses: [...rr.responses, { type: 'image', value: '' }] }
                            : rr,
                        ),
                      )
                    }
                  >
                    Add Image
                  </button>
                </div>
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
        <button type="submit" disabled={loading} className="self-start px-4 py-2 bg-black text-white rounded disabled:opacity-50">
          {loading ? '儲存中...' : '儲存'}
        </button>
      </form>
      {editingItem ? (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded flex flex-col gap-2">
            <div className="relative w-64 h-64 overflow-hidden">
              <Image
                src={editingSrc}
                alt="edit"
                fill
                className="object-cover"
                style={{
                  objectPosition: `${editingX}% ${editingY}%`,
                  transform: `scale(${editingScale})`,
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
                value={editingScale}
                onChange={(e) => {
                  if (!editing) return
                  const v = Number(e.target.value)
                  setRules((r) =>
                    r.map((rr, ri) => {
                      if (ri !== editing.rule) return rr
                      const responses = rr.responses.map((rs, ci) =>
                        ci === editing.idx ? { ...rs, scale: v } : rs,
                      )
                      return { ...rr, responses }
                    }),
                  )
                }}
              />
            </label>
            <label className="text-sm">
              x
              <input
                type="range"
                min="-100"
                max="100"
                value={editingX}
                onChange={(e) => {
                  if (!editing) return
                  const v = Number(e.target.value)
                  setRules((r) =>
                    r.map((rr, ri) => {
                      if (ri !== editing.rule) return rr
                      const responses = rr.responses.map((rs, ci) =>
                        ci === editing.idx ? { ...rs, x: v } : rs,
                      )
                      return { ...rr, responses }
                    }),
                  )
                }}
              />
            </label>
            <label className="text-sm">
              y
              <input
                type="range"
                min="-100"
                max="100"
                value={editingY}
                onChange={(e) => {
                  if (!editing) return
                  const v = Number(e.target.value)
                  setRules((r) =>
                    r.map((rr, ri) => {
                      if (ri !== editing.rule) return rr
                      const responses = rr.responses.map((rs, ci) =>
                        ci === editing.idx ? { ...rs, y: v } : rs,
                      )
                      return { ...rr, responses }
                    }),
                  )
                }}
              />
            </label>
            <button
              type="button"
              className="px-3 py-1 border rounded"
              onClick={() => setEditing(null)}
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
