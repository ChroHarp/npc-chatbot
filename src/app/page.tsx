"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/libs/firebase";
import type { CharacterDoc } from "@/types";
import { characters as defaultCharacters } from "@/data/characters";

export default function HomePage() {
  const router = useRouter();
  const [value] = useCollection(collection(db, "characters"));
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);

  const characters = [
    {
      id: "default",
      name: "預設角色",
      avatarUrl: defaultCharacters.default.avatarUrl,
      avatarX: defaultCharacters.default.avatarX,
      avatarY: defaultCharacters.default.avatarY,
      avatarScale: defaultCharacters.default.avatarScale,
    },
    ...(value?.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as CharacterDoc),
      }))
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) || []),
  ];

  function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === '034918239*') {
      router.push('/admin');
    } else {
      setPwError(true);
      setPw('');
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">選擇角色</h1>
        <button onClick={() => { setShowPw(true); setPwError(false); setPw(''); }} className="text-blue-500 underline">
          管理模式
        </button>
      </div>

      {showPw && (
        <form onSubmit={handleAdminSubmit} className="flex flex-col gap-2 p-3 border rounded bg-gray-50">
          <label className="text-sm font-medium">管理者密碼</label>
          <input
            type="password"
            autoFocus
            className="border rounded px-2 py-1 text-sm"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(false); }}
          />
          {pwError && <p className="text-red-600 text-xs">密碼錯誤</p>}
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1 bg-black text-white text-sm rounded">進入</button>
            <button type="button" className="px-3 py-1 text-sm text-gray-500" onClick={() => setShowPw(false)}>取消</button>
          </div>
        </form>
      )}
      <div className="flex flex-col gap-3">
        {characters.map((ch) => (
          <Link
            key={ch.id}
            href={`/chat/${ch.id}`}
            className="flex items-center gap-4 p-3 border rounded hover:bg-gray-50"
          >
            <div className="relative w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
              <Image
                src={ch.avatarUrl || "/next.svg"}
                alt={ch.name}
                fill
                className="object-cover"
                style={{
                  transform: `translate(${ch.avatarX ?? 0}%, ${ch.avatarY ?? 0}%) scale(${
                    ch.avatarScale ?? 1
                  })`,
                }}
              />
            </div>
            <span>{ch.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
