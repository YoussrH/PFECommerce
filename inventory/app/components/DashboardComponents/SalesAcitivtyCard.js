import Link from 'next/link'
import React from 'react'

export default function SalesAcitivtyCard({item}) {
  return (
    <Link  href={item.href} className='shadow rounded-lg bg-white border border-gray-100 hover:border-blue-200 cursor-pointer px-2 py-4 flex items-center flex-col gap-3 transition-all duration-300'>
        <h4 className={`font-semibold text-2xl ${item.color}`}>{item.number}</h4>
        <small className="text-slate-500">{item.unit}</small>
        <div className='flex items-center space-x-2  text-slate-500'>
            <item.icon/>
            <span className="uppercase text-xs">{item.title}</span>
        </div>
    </Link>
  )
}
