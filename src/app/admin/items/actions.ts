import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db, storage, auth } from '@/libs/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signInAnonymously } from 'firebase/auth'
import type { ItemDoc } from '@/types'

type ItemInput = Omit<ItemDoc, 'createdAt' | 'order'>

export async function createItem(data: ItemInput, file?: File) {
  if (!auth.currentUser) await signInAnonymously(auth)
  let imageUrl = data.imageUrl
  if (file) {
    if (file.size > 3 * 1024 * 1024) throw new Error('檔案大小不能超過 3MB')
    const imgRef = ref(storage, `items/${crypto.randomUUID()}`)
    await uploadBytes(imgRef, file)
    imageUrl = await getDownloadURL(imgRef)
  }
  const snaps = await getDocs(collection(db, 'items'))
  const payload = Object.fromEntries(
    Object.entries({ ...data, imageUrl: imageUrl ?? null }).filter(([, v]) => v !== undefined)
  )
  await addDoc(collection(db, 'items'), {
    ...payload,
    createdAt: serverTimestamp(),
    order: snaps.size,
  })
}

export async function updateItem(id: string, data: Partial<ItemInput>, file?: File) {
  if (!auth.currentUser) await signInAnonymously(auth)
  let update: Partial<ItemInput> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )
  if (file) {
    if (file.size > 3 * 1024 * 1024) throw new Error('檔案大小不能超過 3MB')
    const imgRef = ref(storage, `items/${crypto.randomUUID()}`)
    await uploadBytes(imgRef, file)
    update = { ...update, imageUrl: await getDownloadURL(imgRef) }
  }
  await updateDoc(doc(db, 'items', id), update)
}

export async function deleteItem(id: string) {
  if (!auth.currentUser) await signInAnonymously(auth)
  await deleteDoc(doc(db, 'items', id))
}
