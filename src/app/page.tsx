"use client"

import Image from "next/image";
import Link from "next/link";
import { collection } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/libs/firebase";
import type { CharacterDoc } from "@/types";
import { characters as defaultCharacters } from "@/data/characters";

export default function HomePage() {
  const [value] = useCollection(collection(db, "characters"));

  const characters = [
    {
      id: "default",
      name: "預設角色",
      avatarUrl: defaultCharacters.default.avatarUrl,
      avatarX: defaultCharacters.default.avatarX,
      avatarY: defaultCharacters.default.avatarY,
      avatarScale: defaultCharacters.default.avatarScale,
    },
    ...(
      value?.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as CharacterDoc),
        }))
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) || []
    ),
  ];

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-semibold">選擇角色</h1>
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
