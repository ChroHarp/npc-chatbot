// src/app/admin/characters/actions.ts
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db, storage, auth } from '@/libs/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signInAnonymously } from 'firebase/auth'
import { CharacterDoc, Rule, ResponseItem } from '@/types'

export async function createCharacter(name: string, file: File) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  // 1. 上傳圖片
  const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  // 2. 寫入資料
  const docData: CharacterDoc = {
    name,
    avatarUrl: url,
    rules: [
      {
        keywords: [],
        responses: [],
      },
    ],
  }
  await addDoc(collection(db, 'characters'), docData)
}

export async function updateCharacter(
  id: string,
  name: string,
  rules: Rule[],
  file?: File,
) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const processedRules: Rule[] = []
  for (const rule of rules) {
    const responses: ResponseItem[] = []
    for (const res of rule.responses) {
      if (res.type === 'image' && typeof res.value !== 'string') {
        const imgRef = ref(storage, `responses/${crypto.randomUUID()}`)
        await uploadBytes(imgRef, res.value as unknown as File)
        const url = await getDownloadURL(imgRef)
        responses.push({ type: 'image', value: url })
      } else {
        responses.push(res)
      }
    }
    processedRules.push({ keywords: rule.keywords, responses })
  }

  const data: Partial<CharacterDoc> = {
    name,
    rules: processedRules,
  }

  if (file) {
    const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    data.avatarUrl = url;
  }

  await updateDoc(doc(db, 'characters', id), data);
}
