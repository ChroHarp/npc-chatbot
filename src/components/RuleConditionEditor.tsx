'use client'

import { useState } from 'react'
import type { QuerySnapshot } from 'firebase/firestore'
import type { RuleCondition } from '@/types'
import type { ItemDoc, TaskDoc } from '@/types'

interface Props {
  conditions: RuleCondition
  onChange: (c: RuleCondition) => void
  itemsSnap: QuerySnapshot | undefined
  taskSnap: QuerySnapshot | undefined
  characterTasks: string[]
}

export function RuleConditionEditor({ conditions, onChange, itemsSnap, taskSnap, characterTasks }: Props) {
  const [open, setOpen] = useState(false)
  const [addingItem, setAddingItem] = useState<'requireItems' | 'requireAnyItem' | 'forbidItems' | null>(null)
  const [addingTask, setAddingTask] = useState(false)

  function updateCond(patch: Partial<RuleCondition>) {
    onChange({ ...conditions, ...patch })
  }

  function removeFromArray(field: 'requireItems' | 'requireAnyItem' | 'forbidItems' | 'requireTaskComplete', value: string) {
    updateCond({ [field]: (conditions[field] ?? []).filter((v) => v !== value) })
  }

  function addToArray(field: 'requireItems' | 'requireAnyItem' | 'forbidItems' | 'requireTaskComplete', value: string) {
    if (!value || (conditions[field] ?? []).includes(value)) return
    updateCond({ [field]: [...(conditions[field] ?? []), value] })
  }

  const itemPillClass = 'px-2 py-0.5 text-sm bg-blue-50 border border-blue-200 rounded flex items-center gap-1'
  const taskPillClass = 'px-2 py-0.5 text-sm bg-purple-50 border border-purple-200 rounded flex items-center gap-1'

  function getItemName(id: string) {
    return itemsSnap?.docs.find((d) => d.id === id)?.data()?.name ?? id
  }

  function getTaskName(id: string) {
    return (taskSnap?.docs.find((d) => d.id === id)?.data() as TaskDoc | undefined)?.name ?? id
  }

  function ItemPicker({ field }: { field: 'requireItems' | 'requireAnyItem' | 'forbidItems' }) {
    const current = conditions[field] ?? []
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {current.map((id) => (
          <span key={id} className={itemPillClass}>
            {getItemName(id)}
            <button type="button" className="text-xs text-red-600" onClick={() => removeFromArray(field, id)}>×</button>
          </span>
        ))}
        <button type="button" className="px-2 py-0.5 text-xs border rounded" onClick={() => setAddingItem(field)}>+ 物品</button>
        {addingItem === field && (
          <select
            autoFocus
            className="border rounded px-1 py-0.5 text-sm"
            defaultValue=""
            onChange={(e) => { addToArray(field, e.target.value); setAddingItem(null) }}
            onBlur={() => setAddingItem(null)}
          >
            <option value="">選擇物品</option>
            {itemsSnap?.docs.filter((d) => !current.includes(d.id)).map((d) => (
              <option key={d.id} value={d.id}>{(d.data() as ItemDoc).name}</option>
            ))}
          </select>
        )}
      </div>
    )
  }

  return (
    <div className="border border-dashed rounded p-2 flex flex-col gap-2">
      <button
        type="button"
        className="text-sm font-medium text-left flex items-center gap-1 text-gray-600"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? '▾' : '▸'}</span> 條件設定 conditions
      </button>
      {open && (
        <div className="flex flex-col gap-3 pl-2">
          {/* Time window */}
          <div className="flex gap-3 items-center">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              最少分鐘
              <input
                type="number"
                min="0"
                className="border rounded px-1 py-0.5 w-16 text-sm"
                value={conditions.minElapsedMinutes ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? undefined : Number(e.target.value)
                  const next = { ...conditions }
                  if (v === undefined) delete next.minElapsedMinutes
                  else next.minElapsedMinutes = v
                  onChange(next)
                }}
              />
            </label>
            <label className="text-xs text-gray-500 flex items-center gap-1">
              最多分鐘
              <input
                type="number"
                min="0"
                className="border rounded px-1 py-0.5 w-16 text-sm"
                value={conditions.maxElapsedMinutes ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? undefined : Number(e.target.value)
                  const next = { ...conditions }
                  if (v === undefined) delete next.maxElapsedMinutes
                  else next.maxElapsedMinutes = v
                  onChange(next)
                }}
              />
            </label>
          </div>

          {/* requireItems */}
          <div>
            <p className="text-xs text-gray-500 mb-1">必須全部持有 requireItems</p>
            <ItemPicker field="requireItems" />
          </div>

          {/* requireAnyItem */}
          <div>
            <p className="text-xs text-gray-500 mb-1">持有其中一個 requireAnyItem</p>
            <ItemPicker field="requireAnyItem" />
          </div>

          {/* forbidItems */}
          <div>
            <p className="text-xs text-gray-500 mb-1">不得持有 forbidItems</p>
            <ItemPicker field="forbidItems" />
          </div>

          {/* requireTaskComplete */}
          <div>
            <p className="text-xs text-gray-500 mb-1">任務必須完成 requireTaskComplete</p>
            <div className="flex flex-wrap gap-1 items-center">
              {(conditions.requireTaskComplete ?? []).map((id) => (
                <span key={id} className={taskPillClass}>
                  {getTaskName(id)}
                  <button type="button" className="text-xs text-red-600" onClick={() => removeFromArray('requireTaskComplete', id)}>×</button>
                </span>
              ))}
              {characterTasks.length > 0 && (
                <button type="button" className="px-2 py-0.5 text-xs border rounded" onClick={() => setAddingTask(true)}>+ 任務</button>
              )}
              {addingTask && (
                <select
                  autoFocus
                  className="border rounded px-1 py-0.5 text-sm"
                  defaultValue=""
                  onChange={(e) => { addToArray('requireTaskComplete', e.target.value); setAddingTask(false) }}
                  onBlur={() => setAddingTask(false)}
                >
                  <option value="">選擇任務</option>
                  {characterTasks
                    .filter((tid) => !(conditions.requireTaskComplete ?? []).includes(tid))
                    .map((tid) => (
                      <option key={tid} value={tid}>{getTaskName(tid)}</option>
                    ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
