'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '@/libs/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
      } else {
        const cred = await signInAnonymously(auth)
        setUser(cred.user)
      }
    })
    return unsub
  }, [])

  return { uid: user?.uid ?? null }
}
