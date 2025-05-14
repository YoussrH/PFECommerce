"use client"
import {  HelpCircle, LayoutGrid, List, MoreHorizontal, Plus } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { TiArrowSortedDown } from "react-icons/ti";
export default function FixedHeader({newLinks}) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    "Option 1", "Option 2", "Option 3", "Option 4", "Option 5", 
    "Option 6", "Option 7", "Option 8", "Option 9", "Option 10"
  ];

  return (
    <div className="flex sticky top-0 border-b-2 justify-between items-center font-sans bg-white py-4 px-4">
      
      <div className="relative">
      <button
        className=" px-4 py-2 rounded-md flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        Tous les articles
        <TiArrowSortedDown 
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : "-rotate-0"}`} 
        />
      </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="max-h-48 overflow-y-auto">
              {options.map((option, index) => (
                <button 
                  key={index} 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link href={newLinks} className="p-1 rounded-md bg-blue-600 flex px-3 text-white items-center space-x-2">
          <Plus className="text-slate-50 w-4 h-4"/>
          <span>Nouveau</span>
        </Link>

        <div className="flex rounded-md overflow-hidden">
          <button className="bg-gray-200 p-2 border-r border-gray-300">
            <List className="w-4 h-4"/>
          </button>
          <button className="bg-gray-100 p-2">
            <LayoutGrid className="w-4 h-4"/>
          </button>
        </div>

        <button className="bg-gray-100 p-2 rounded-md">
          <MoreHorizontal className="w-5 h-5"/>
        </button>

        <button className="bg-orange-400 p-2 text-white rounded-md">
          <HelpCircle className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
}
