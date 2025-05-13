"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

export default function SubmenuLuxe() {
  const [marques, setMarques] = useState([
    { id: 1, libelle: "Marc Jacobs" },
    { id: 2, libelle: "Hugo Boss" },
    { id: 3, libelle: "Tommy Hilfiger" },
    { id: 4, libelle: "Calvin Klein" },
    { id: 5, libelle: "Ralph Lauren" },
  ])

  const [categories, setCategories] = useState([
    { id: 1, libelle: "Vêtements" },
    { id: 2, libelle: "Chaussures" },
    { id: 3, libelle: "Accessoires" },
    { id: 4, libelle: "Montres" },
    { id: 5, libelle: "Parfums" },
  ])

  // In a real implementation, you would fetch this data from your API
  useEffect(() => {
    // Fetch data from API if needed
    // This is a placeholder for the actual API call
  }, [])

  return (
    <div className="container mx-auto py-8 px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brands Section */}
        <div>
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider mb-4">Marques de Luxe</h4>
          <ul className="space-y-2">
            {marques.map((marque) => (
              <li key={marque.id}>
                <Link
                  href={`/luxe/marques/${marque.id}`}
                  className="text-gray-600 hover:text-black transition-colors text-xs"
                >
                  {marque.libelle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/luxe/marques"
                className="text-gray-600 hover:text-black transition-colors text-xs font-medium"
              >
                Voir toutes les marques
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories Section */}
        <div>
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider mb-4">Catégories</h4>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/luxe/categories/${category.id}`}
                  className="text-gray-600 hover:text-black transition-colors text-xs"
                >
                  {category.libelle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/luxe/nouveautes"
                className="text-gray-600 hover:text-black transition-colors text-xs font-medium"
              >
                Nouveautés Luxe
              </Link>
            </li>
          </ul>
        </div>

        {/* Featured Luxury */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-6">
            {/* Marc Jacobs Section */}
            <div className="relative group">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/DINA-ORANGE-3-.jpg"
                  alt="Marc Jacobs"
                  width={320}
                  height={400}
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-xs font-semibold mb-2">Marc Jacobs</h4>
                <Link
                  href="/luxe/marques/1"
                  className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
                >
                  Découvrir Plus
                </Link>
              </div>
            </div>

            {/* Hugo Boss Section */}
            <div className="relative group">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/FNACBLG23D16-3-scaled-1.jpg"
                  alt="Hugo Boss"
                  width={320}
                  height={400}
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-xs font-semibold mb-2">Hugo Boss</h4>
                <Link
                  href="/luxe/marques/2"
                  className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
                >
                  Découvrir Plus
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
