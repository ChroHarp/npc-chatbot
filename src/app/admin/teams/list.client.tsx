'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { DataTable, Column } from '@/components/data-table'
import Link from 'next/link'
import type { TeamDoc } from '@/types'
import { deleteTeam } from './actions'

type TeamRow = TeamDoc & { id: string }

export default function TeamsListPage() {
  const [snap] = useCollection(query(collection(db, 'teams'), orderBy('createdAt', 'desc')))
  const [cleaning, setCleaning] = useState(false)

  async function handleCleanup() {
    if (!confirm('刪除所有已過期（建立超過 48 小時）的小隊？')) return
    setCleaning(true)
    try {
      const res = await fetch('/api/admin/cleanup-teams', { method: 'DELETE' })
      const { deleted } = await res.json() as { deleted: number }
      alert(`已刪除 ${deleted} 個過期小隊`)
    } finally {
      setCleaning(false)
    }
  }
  const teams: TeamRow[] = snap?.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDoc) })) || []

  const columns: Column<TeamRow>[] = [
    {
      header: '代碼',
      accessor: (row) => (
        <span className="font-mono font-bold text-lg tracking-widest">{row.id}</span>
      ),
      widthClassName: 'w-24',
    },
    {
      header: '成員數',
      accessor: (row) => `${row.members.length} 人`,
      widthClassName: 'w-24',
    },
    {
      header: '建立時間',
      accessor: (row) =>
        row.createdAt ? row.createdAt.toDate().toLocaleString('zh-TW') : '—',
      widthClassName: 'w-48',
    },
    {
      header: '',
      accessor: (row) => (
        <Link href={`/admin/teams/${row.id}`} className="text-blue-500 underline">
          管理
        </Link>
      ),
      widthClassName: 'w-20',
    },
    {
      header: '',
      accessor: (row) => (
        <button
          className="text-red-600 underline"
          onClick={async () => {
            if (confirm(`確定要刪除隊伍 ${row.id}？`)) await deleteTeam(row.id)
          }}
        >
          刪除
        </button>
      ),
      widthClassName: 'w-20',
    },
  ]

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">隊伍管理</h1>
        <button
          onClick={handleCleanup}
          disabled={cleaning}
          className="px-3 py-1.5 text-sm border border-red-400 text-red-500 rounded disabled:opacity-50"
        >
          {cleaning ? '清理中...' : '清理過期小隊'}
        </button>
      </div>
      <DataTable columns={columns} data={teams} />
    </div>
  )
}
