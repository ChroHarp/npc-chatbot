import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'
import { db, auth } from '@/libs/firebase'

export async function createTask(name: string, description: string, characterIds: string[]) {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  const docRef = await addDoc(collection(db, 'tasks'), { name, description, createdAt: serverTimestamp() })
  for (const cid of characterIds) {
    await updateDoc(doc(db, 'characters', cid), { tasks: arrayUnion(docRef.id) })
  }
}

export async function updateTask(id: string, name: string, description: string, characterIds: string[]) {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  await updateDoc(doc(db, 'tasks', id), { name, description })
  const snaps = await getDocs(collection(db, 'characters'))
  for (const snap of snaps.docs) {
    const has = (snap.data().tasks || []).includes(id)
    const should = characterIds.includes(snap.id)
    if (should && !has) {
      await updateDoc(snap.ref, { tasks: arrayUnion(id) })
    } else if (!should && has) {
      await updateDoc(snap.ref, { tasks: arrayRemove(id) })
    }
  }
}

export async function deleteTask(id: string) {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  await deleteDoc(doc(db, 'tasks', id))
  const snaps = await getDocs(collection(db, 'characters'))
  for (const snap of snaps.docs) {
    if ((snap.data().tasks || []).includes(id)) {
      await updateDoc(snap.ref, { tasks: arrayRemove(id) })
    }
  }
}
