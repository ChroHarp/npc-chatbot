'use client'

import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div className="p-6 flex flex-col gap-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">管理介面</h1>
      <Link href="/admin/characters" className="text-blue-500 underline">
        角色管理
      </Link>
      <Link href="/admin/tasks" className="text-blue-500 underline">
        任務管理
      </Link>
    </div>
  )
}
