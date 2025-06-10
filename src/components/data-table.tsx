'use client'

import React from 'react'

export interface Column<T> {
  header: React.ReactNode
  accessor: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-800 [&_tr]:border-b">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((row, i) => (
            <tr key={i} className="border-b">
              {columns.map((col, j) => (
                <td key={j} className="px-3 py-2">
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
