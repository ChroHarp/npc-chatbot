'use client'

import dynamicImport from 'next/dynamic'

const EditCharacterClient = dynamicImport(() => import('./edit.client'), { ssr: false })

export const dynamic = 'force-dynamic'

export default function EditCharacterPage() {
  return <EditCharacterClient />
}
