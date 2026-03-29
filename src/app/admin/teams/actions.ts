import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/libs/firebase'

export async function deleteTeam(teamCode: string) {
  await deleteDoc(doc(db, 'teams', teamCode))
}

export async function resetTeamProgress(teamCode: string) {
  await updateDoc(doc(db, 'teams', teamCode), { taskProgress: {} })
}
