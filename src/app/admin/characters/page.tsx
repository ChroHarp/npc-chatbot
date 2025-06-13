'use client'

import dynamicImport from 'next/dynamic'

const CharactersPageClient = dynamicImport(() => import('./list.client'), { ssr: false })

export const dynamic = 'force-dynamic'

export default function CharactersPage() {
  return <CharactersPageClient />
}
