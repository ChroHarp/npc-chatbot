import Image from 'next/image'
import type { ItemDoc } from '@/types'

interface Props {
  id: string
  item: ItemDoc
  quantity: number
}

export function ItemCard({ item, quantity }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-white relative">
      {quantity > 1 && (
        <span className="absolute top-1 right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">
          {quantity}
        </span>
      )}
      {item.imageUrl ? (
        <div className="relative w-16 h-16 overflow-hidden rounded">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            style={{
              transform: `translate(${item.imageX ?? 0}%, ${item.imageY ?? 0}%) scale(${item.imageScale ?? 1})`,
            }}
          />
        </div>
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-2xl">
          ?
        </div>
      )}
      <p className="text-sm font-medium text-center leading-tight">{item.name}</p>
      {item.description && (
        <p className="text-xs text-gray-500 text-center leading-tight">{item.description}</p>
      )}
    </div>
  )
}
