'use client'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, documentId } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'
import type { TaskDoc } from '@/types'

interface Props {
  characterId: string
  characterTasks: string[]
  characterLoaded: boolean
  onComplete: (teamCode: string) => void
}

export function ChatSetup({ characterId, characterTasks, characterLoaded, onComplete }: Props) {
  const { uid } = useAuth()
  const { teamCode, team, createTeam, joinTeam } = useTeam()
  const [tasks, setTasks] = useState<{ id: string; name: string }[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch task names for this character's tasks
  useEffect(() => {
    if (!characterLoaded) return
    if (characterTasks.length === 0) {
      setTasksLoaded(true)
      return
    }
    getDocs(query(collection(db, 'tasks'), where(documentId(), 'in', characterTasks)))
      .then((snap) => {
        const fetched = snap.docs.map((d) => ({ id: d.id, name: (d.data() as TaskDoc).name }))
        setTasks(fetched)
        if (fetched.length === 1) setSelectedTask(fetched[0].id)
      })
      .finally(() => setTasksLoaded(true))
  }, [characterLoaded, characterTasks])

  const needsTaskSelection = tasks.length > 1
  const taskReady = !needsTaskSelection || selectedTask !== null
  const teamReady = !!teamCode
  const canStart = taskReady && teamReady && tasksLoaded

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
    if (!uid || joinInput.length !== 4) return
    setLoading(true)
    setError(null)
    try {
      await joinTeam(joinInput, uid)
      setJoinInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入失敗')
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    if (!canStart || !teamCode) return
    if (selectedTask) localStorage.setItem(`taskId-${characterId}`, selectedTask)
    onComplete(teamCode)
  }

  if (!characterLoaded || !tasksLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        載入中...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Task selection — only when character appears in multiple tasks */}
      {needsTaskSelection && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">選擇任務</h2>
          <p className="text-sm text-gray-500">此角色出現在多個任務，請選擇你正在進行的任務：</p>
          {tasks.map((t) => (
            <label
              key={t.id}
              className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                selectedTask === t.id ? 'border-teal-500 bg-teal-50' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="task"
                value={t.id}
                checked={selectedTask === t.id}
                onChange={() => setSelectedTask(t.id)}
              />
              {t.name}
            </label>
          ))}
        </section>
      )}

      {/* Team setup */}
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">小隊</h2>
        {teamCode && team ? (
          <div className="p-4 border border-teal-200 bg-teal-50 rounded flex flex-col items-center gap-1">
            <p className="text-xs text-teal-600">已加入隊伍</p>
            <p className="text-4xl font-bold tracking-widest">{teamCode}</p>
            <p className="text-sm text-gray-500">{team.members.length} 人</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleCreate}
              disabled={loading || !uid}
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
            >
              建立新隊伍
            </button>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <hr className="flex-1" />
              <span>或</span>
              <hr className="flex-1" />
            </div>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="4 位數隊伍代碼"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.replace(/\D/g, ''))}
                className="border rounded px-3 py-2 text-center text-xl tracking-widest flex-1"
              />
              <button
                type="submit"
                disabled={loading || joinInput.length !== 4 || !uid}
                className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
              >
                加入
              </button>
            </form>
            {!uid && (
              <p className="text-xs text-gray-400 text-center">正在初始化身份...</p>
            )}
          </>
        )}
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="px-4 py-2 bg-teal-500 text-white rounded disabled:opacity-50"
      >
        開始對話
      </button>
    </div>
  )
}
