'use client'
import dynamicImport from 'next/dynamic'

const EditTaskClient = dynamicImport(() => import('./edit.client'), { ssr: false })
export const dynamic = 'force-dynamic'
export default function EditTaskPage() {
  return <EditTaskClient />
}
