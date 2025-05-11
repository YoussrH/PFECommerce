import Link from 'next/link'
import React from 'react'
import Image from "next/image";

export default function ItemCard({OptionsData}) {
    const {title,linklabel,src,description,enabled}=OptionsData;

  return (
    <div className="shadow-md rounded bg-white flex flex-col items-center justify-center gap-4 p-6">
    <h2 className='font-semibold'>{title}</h2>
    <div className=''>

    <Image src={src} alt="Animated GIF" className="w-28" width={112} height={112} />
    </div>
    <p> {description}</p>
    {enabled ?(<Link href="#" className="py-1.5 rounded-md bg-blue-600 inline-flex px-3 text-white  items-center space-x-2">
         {linklabel} 
    </Link>):<button className='p-1 rounded-md bg-blue-600 inline-flex px-3 text-white  items-center space-x-2'>Enable</button>
}
    </div>
  )
}
