import React from 'react'

export default function InventorySummaryCard({item}) {
  return (
    <div  className="mb-4 shadow rounded-lg bg-white border border-gray-100 hover:border-blue-200 cursor-pointer px-4 py-2 flex items-center justify-between gap-2 transition-all duration-300">
    <h2 className="uppercase text-xs text-slate-500">{item.title}</h2>
    <h4 className="font-semibold text-lg">{item.number}</h4>

    </div>
  )
}
