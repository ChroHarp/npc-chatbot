'use client'
export const dynamic = 'force-dynamic'

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
      <h1 className="text-xl font-semibold mb-4">隊伍管理</h1>
      <DataTable columns={columns} data={teams} />
    </div>
  )
}
