'use client'
import { useParams, useRouter } from 'next/navigation'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import type { TeamDoc } from '@/types'
import { deleteTeam, resetTeamProgress } from '../actions'

export const dynamic = 'force-dynamic'

export default function TeamDetailPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [snap, loading] = useDocument(doc(db, 'teams', code))
  const team = snap?.data() as TeamDoc | undefined

  if (loading) return <div className="p-6">載入中...</div>
  if (!team) return <div className="p-6 text-red-600">找不到此隊伍</div>

  const progressEntries = Object.entries(team.taskProgress || {})

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          隊伍 <span className="font-mono tracking-widest">{code}</span>
        </h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 underline">
          返回
        </button>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-gray-700">成員（{team.members.length} 人）</h2>
        <ul className="text-sm text-gray-500 flex flex-col gap-1">
          {team.members.map((uid) => (
            <li key={uid} className="font-mono truncate">
              {uid}
            </li>
          ))}
        </ul>
      </section>

      {progressEntries.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-gray-700">任務進度</h2>
          <ul className="text-sm flex flex-col gap-1">
            {progressEntries.map(([taskId, status]) => (
              <li key={taskId} className="flex justify-between">
                <span className="font-mono text-gray-500">{taskId}</span>
                <span
                  className={
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'active'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  }
                >
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 pt-4 border-t">
        <button
          onClick={async () => {
            if (confirm('確定要重設所有任務進度？')) {
              await resetTeamProgress(code)
            }
          }}
          className="px-4 py-2 border border-gray-400 text-gray-700 rounded"
        >
          重設任務進度
        </button>
        <button
          onClick={async () => {
            if (confirm(`確定要刪除隊伍 ${code}？此操作無法復原。`)) {
              await deleteTeam(code)
              router.push('/admin/teams')
            }
          }}
          className="px-4 py-2 border border-red-500 text-red-500 rounded"
        >
          刪除隊伍
        </button>
      </div>
    </div>
  )
}
