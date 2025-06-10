// src/app/api/seed/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/libs/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ❗️確定放在 `app/api/seed/route.ts` 才會走 Edge Runtime
export const dynamic = 'force-dynamic'; // 避免被預先靜態化

export async function GET() {
  // 1. 建角色
  const charRef = await addDoc(collection(db, 'characters'), {
    name: '範例角色',
    avatarUrl: 'https://placehold.co/256x256.png',
    description: '這是 Seed Script 建立的角色',
  });

  // 2. 建對應規則
  await addDoc(collection(db, 'replyRules'), {
    characterId: charRef.id,
    ruleType: 'INITIAL',
    keywords: [],
    payloadType: 'TEXT',
    payloadValue: '歡迎使用 NPC Chat！',
    priority: 0,
    createdAt: serverTimestamp(),
  });

  return NextResponse.json({ ok: true, characterId: charRef.id });
}
