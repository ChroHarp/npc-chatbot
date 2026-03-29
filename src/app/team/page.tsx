'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'

export default function TeamPage() {
  const router = useRouter()
  const { uid } = useAuth()
  const { teamCode, team, createTeam, joinTeam, leaveTeam } = useTeam()
  const [joinInput, setJoinInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      await createTeam(uid)
    } catch (e) {
      setError(e instanceof Error ? e.message : '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!uid || !joinInput.trim()) return
    setLoading(true)
    setError(null)
    try {
      await joinTeam(joinInput.trim(), uid)
      setJoinInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">隊伍</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 underline">
          返回
        </button>
      </div>

      {teamCode && team ? (
        <div className="flex flex-col gap-4">
          <div className="border rounded p-4 flex flex-col gap-2">
            <p className="text-sm text-gray-500">隊伍代碼</p>
            <p className="text-4xl font-bold tracking-widest text-center">{teamCode}</p>
            <p className="text-sm text-center text-gray-500">
              成員人數：{team.members.length} 人
            </p>
          </div>
          <button
            onClick={leaveTeam}
            className="px-4 py-2 border border-red-500 text-red-500 rounded"
          >
            離開隊伍
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={handleCreate}
            disabled={loading || !uid}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? '處理中...' : '建立新隊伍'}
          </button>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <hr className="flex-1" />
            <span>或</span>
            <hr className="flex-1" />
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="輸入 4 位數隊伍代碼"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.replace(/\D/g, ''))}
              className="border rounded px-3 py-2 text-center text-2xl tracking-widest"
            />
            <button
              type="submit"
              disabled={loading || joinInput.length !== 4 || !uid}
              className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
            >
              加入隊伍
            </button>
          </form>

          {!uid && (
            <p className="text-sm text-gray-400 text-center">正在初始化身份...</p>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
