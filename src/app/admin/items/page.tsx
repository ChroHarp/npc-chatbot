'use client'
import dynamicImport from 'next/dynamic'

const ItemsListClient = dynamicImport(() => import('./list.client'), { ssr: false })
export const dynamic = 'force-dynamic'

export default function ItemsPage() {
  return <ItemsListClient />
}
