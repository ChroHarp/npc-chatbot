'use client'
import dynamicImport from 'next/dynamic'

const TeamsListPage = dynamicImport(() => import('./list.client'), { ssr: false })
export const dynamic = 'force-dynamic'
export default function TeamsPage() {
  return <TeamsListPage />
}
