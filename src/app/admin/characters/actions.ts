// src/app/admin/characters/actions.ts
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '@/libs/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

export async function createCharacter(name: string, file: File) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  // 1. 上傳圖片
  const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  // 2. 寫入資料
  await addDoc(collection(db, 'characters'), {
    name,
    avatarUrl: url,
    description: '',
  });
}

export async function updateCharacter(
  id: string,
  name: string,
  description: string,
  file?: File,
) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const data: { name: string; description: string; avatarUrl?: string } = {
    name,
    description,
  };

  if (file) {
    const imgRef = ref(storage, `avatars/${crypto.randomUUID()}`);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    data.avatarUrl = url;
  }

  await updateDoc(doc(db, 'characters', id), data);
}
