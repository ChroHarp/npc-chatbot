// src/app/admin/characters/actions.ts
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, storage, auth } from '@/libs/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signInAnonymously } from 'firebase/auth'
import { CharacterDoc, Rule, ResponseItem } from '@/types'

export async function createCharacter(name: string, file: File) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('檔案大小不能超過 3MB');
  }
  // 1. 上傳圖片
  const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  // 2. 寫入資料
  const docData: CharacterDoc = {
    name,
    avatarUrl: url,
    avatarScale: 1,
    avatarX: 0,
    avatarY: 0,
    order: 0,
    tasks: [],
    rules: [
      {
        keywords: [],
        responses: [
          {
            type: 'text',
            value: `您好，我是${name}，很高興認識您。`,
          },
        ],
        type: 'firstLogin',
      },
      {
        keywords: [],
        responses: [
          {
            type: 'text',
            value: '我不太懂您的意思？',
          },
        ],
        type: 'default',
      },
    ],
  }

  const snaps = await getDocs(collection(db, 'characters'))
  const docs = snaps.docs.sort(
    (a, b) =>
      (a.data().order ?? Infinity) - (b.data().order ?? Infinity)
  )
  const batch = writeBatch(db)
  docs.forEach((snap, idx) => {
    batch.update(snap.ref, { order: idx + 1 })
  })
  await batch.commit()

  await addDoc(collection(db, 'characters'), docData)
}

export async function updateCharacter(
  id: string,
  name: string,
  rules: Rule[],
  file?: File,
  avatarScale?: number,
  avatarX?: number,
  avatarY?: number,
  tasks?: string[],
) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const processedRules: Rule[] = []
  for (const rule of rules) {
    const responses: ResponseItem[] = []
    for (const res of rule.responses) {
      if (res.type === 'image' && typeof res.value !== 'string') {
        const imgFile = res.value as unknown as File
        if (imgFile.size > 3 * 1024 * 1024) {
          throw new Error('檔案大小不能超過 3MB')
        }
        const imgRef = ref(storage, `responses/${crypto.randomUUID()}`)
        await uploadBytes(imgRef, imgFile)
        const url = await getDownloadURL(imgRef)
        const item: ResponseItem = { type: 'image', value: url }
        if (typeof res.scale === 'number') item.scale = res.scale
        if (typeof res.x === 'number') item.x = res.x
        if (typeof res.y === 'number') item.y = res.y
        responses.push(item)
      } else {
        const item: ResponseItem = { type: res.type, value: res.value }
        if (typeof res.scale === 'number') item.scale = res.scale
        if (typeof res.x === 'number') item.x = res.x
        if (typeof res.y === 'number') item.y = res.y
        responses.push(item)
      }
    }
    const newRule: Rule = {
      keywords: rule.keywords,
      responses,
    }
    if (rule.type) newRule.type = rule.type
    processedRules.push(newRule)
  }

  const data: Partial<CharacterDoc> = {
    name,
    rules: processedRules,
  }

  if (typeof avatarScale === 'number') data.avatarScale = avatarScale
  if (typeof avatarX === 'number') data.avatarX = avatarX
  if (typeof avatarY === 'number') data.avatarY = avatarY

  if (file) {
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('檔案大小不能超過 3MB')
    }
    const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    data.avatarUrl = url;
  }

  if (tasks) {
    data.tasks = tasks
  }

  await updateDoc(doc(db, 'characters', id), data);
}

export async function deleteCharacter(id: string) {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  await deleteDoc(doc(db, 'characters', id))
}

export async function reorderCharacters(ids: string[]) {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  const batch = writeBatch(db)
  ids.forEach((id, idx) => {
    batch.update(doc(db, 'characters', id), { order: idx })
  })
  await batch.commit()
}
