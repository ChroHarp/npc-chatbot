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
  await addDoc(collection(db, 'items'), {
    ...data,
    imageUrl: imageUrl ?? null,
    createdAt: serverTimestamp(),
    order: snaps.size,
  })
}

export async function updateItem(id: string, data: Partial<ItemInput>, file?: File) {
  if (!auth.currentUser) await signInAnonymously(auth)
  const update: Partial<ItemInput> = { ...data }
  if (file) {
    if (file.size > 3 * 1024 * 1024) throw new Error('檔案大小不能超過 3MB')
    const imgRef = ref(storage, `items/${crypto.randomUUID()}`)
    await uploadBytes(imgRef, file)
    update.imageUrl = await getDownloadURL(imgRef)
  }
  await updateDoc(doc(db, 'items', id), update)
}

export async function deleteItem(id: string) {
  if (!auth.currentUser) await signInAnonymously(auth)
  await deleteDoc(doc(db, 'items', id))
}
