import { X } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function HeaderForm({title,href}) {
  return (
    <div className=" z-50 sticky top-0 flex items-center justify-between bg-white py-3 px-16 border-b-2 rounded-b-md">
    <h2 className='font-semibold text-lg'>{title}</h2> 
    <Link href={href}>
    <X/>
    </Link> 
  </div>
  )
}
