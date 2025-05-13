"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function MobileMenu({ navItems, onClose, onItemClick }) {
  const [expandedItem, setExpandedItem] = useState(null)

  const toggleExpand = (itemName) => {
    setExpandedItem(expandedItem === itemName ? null : itemName)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white md:hidden overflow-y-auto pt-16">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex flex-col space-y-4">
          {navItems.map((item) => (
            <div key={item.name} className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <button
                  className="text-sm font-medium"
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleExpand(item.name)
                    } else {
                      onItemClick(item.route)
                    }
                  }}
                >
                  {item.name}
                  {item.ageRange && <span className="ml-2 text-xs text-gray-500">({item.ageRange})</span>}
                </button>

                {item.hasSubmenu && (
                  <button onClick={() => toggleExpand(item.name)} className="p-1">
                    {expandedItem === item.name ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                )}
              </div>

              {/* Submenu items */}
              {expandedItem === item.name && (
                <div className="mt-3 pl-4 space-y-2">
                  <Link href={`${item.route}/categories`} className="block text-sm text-gray-600" onClick={onClose}>
                    Toutes les catégories
                  </Link>
                  <Link href={`${item.route}/nouveautes`} className="block text-sm text-gray-600" onClick={onClose}>
                    Nouveautés
                  </Link>
                  <Link href={`${item.route}/promotions`} className="block text-sm text-gray-600" onClick={onClose}>
                    Promotions
                  </Link>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-8 space-y-4">
          <Link
            href="/contacts"
            className="block text-sm text-gray-600 border-b border-gray-200 pb-2"
            onClick={onClose}
          >
            Service Client
          </Link>
          <Link href="/stores" className="block text-sm text-gray-600 border-b border-gray-200 pb-2" onClick={onClose}>
            Nos Boutiques
          </Link>
        </div>
      </div>
    </div>
  )
}
