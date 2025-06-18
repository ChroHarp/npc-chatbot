'use client'
import dynamicImport from 'next/dynamic'

const TasksPageClient = dynamicImport(() => import('./list.client'), { ssr: false })
export const dynamic = 'force-dynamic'
export default function TasksPage() {
  return <TasksPageClient />
}
