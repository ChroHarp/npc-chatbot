'use client'
import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import type { TeamDoc } from '@/types'

export function useTeam() {
  const [teamCode, setTeamCode] = useState<string | null>(null)
  const [team, setTeam] = useState<TeamDoc | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('teamCode')
    if (stored) setTeamCode(stored)
  }, [])

  useEffect(() => {
    if (!teamCode) {
      setTeam(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'teams', teamCode), (snap) => {
      if (snap.exists()) {
        setTeam(snap.data() as TeamDoc)
      } else {
        localStorage.removeItem('teamCode')
        setTeamCode(null)
      }
    })
    return unsub
  }, [teamCode])

  const createTeam = useCallback(async (uid: string) => {
    const res = await fetch('/api/team/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
    if (!res.ok) throw new Error('建立隊伍失敗')
    const { teamCode: code } = (await res.json()) as { teamCode: string }
    localStorage.setItem('teamCode', code)
    setTeamCode(code)
    return code
  }, [])

  const joinTeam = useCallback(async (code: string, uid: string) => {
    const res = await fetch('/api/team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode: code, uid }),
    })
    if (!res.ok) {
      const status = res.status
      throw new Error(status === 404 ? '找不到此隊伍代碼' : '加入隊伍失敗')
    }
    localStorage.setItem('teamCode', code)
    setTeamCode(code)
  }, [])

  const leaveTeam = useCallback(() => {
    localStorage.removeItem('teamCode')
    setTeamCode(null)
    setTeam(null)
  }, [])

  return { teamCode, team, createTeam, joinTeam, leaveTeam }
}
