"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function MegaMenu({ activeSubmenu, isVisible, onMouseEnter, onMouseLeave, isScrolled }) {
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [featuredItems, setFeaturedItems] = useState({
    femme: null,
    homme: null,
    garcon: null,
    fille: null,
  })

  // Fetch data when submenu becomes visible
  useEffect(() => {
    if (isVisible && activeSubmenu) {
      fetchSubmenuData(activeSubmenu)
    }
  }, [isVisible, activeSubmenu])

  const fetchSubmenuData = async (submenuName) => {
    // This would be replaced with actual API calls
    // For now, we'll use placeholder data
    setCategories([
      { id: 1, libelle: "T-shirts & Polos" },
      { id: 2, libelle: "Chemises" },
      { id: 3, libelle: "Pantalons" },
      { id: 4, libelle: "Vestes & Manteaux" },
      { id: 5, libelle: "Chaussures" },
    ])

    setBrands([
      { id: 1, libelle: "Nike" },
      { id: 2, libelle: "Adidas" },
      { id: 3, libelle: "Zara" },
      { id: 4, libelle: "H&M" },
      { id: 5, libelle: "Lacoste" },
    ])

    // Set featured items based on active submenu
    // In a real app, these would come from API calls
  }

  if (!isVisible) return null

  return (
    <div
      className={`absolute left-0 w-full bg-white border-t border-gray-200 shadow-lg z-40 transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ top: isScrolled ? "60px" : "auto" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Categories Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">Catégories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.id}`}
                    className="text-sm text-gray-600 hover:text-black transition-colors flex items-center group"
                  >
                    <span>{category.libelle}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/categories`} className="text-sm font-medium text-black hover:underline mt-2 inline-block">
                  Voir toutes les catégories
                </Link>
              </li>
            </ul>
          </div>

          {/* Brands Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">Marques</h3>
            <ul className="space-y-2">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/marques/${brand.id}`}
                    className="text-sm text-gray-600 hover:text-black transition-colors flex items-center group"
                  >
                    <span>{brand.libelle}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/marques`} className="text-sm font-medium text-black hover:underline mt-2 inline-block">
                  Voir toutes les marques
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured Items */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative rounded-lg overflow-hidden">
              <div className="aspect-[4/5] bg-gray-100">
                <Image
                  src="/placeholder.svg?height=400&width=320"
                  alt="Featured item"
                  width={320}
                  height={400}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-white font-medium mb-2">Collection {activeSubmenu}</h4>
                <Link
                  href={`/collections/${activeSubmenu?.toLowerCase()}`}
                  className="inline-flex items-center bg-white text-black px-4 py-2 rounded-full text-sm font-medium"
                >
                  Découvrir
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            <div className="group relative rounded-lg overflow-hidden">
              <div className="aspect-[4/5] bg-gray-100">
                <Image
                  src="/placeholder.svg?height=400&width=320"
                  alt="Featured item"
                  width={320}
                  height={400}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-white font-medium mb-2">Nouveautés {activeSubmenu}</h4>
                <Link
                  href={`/nouveautes/${activeSubmenu?.toLowerCase()}`}
                  className="inline-flex items-center bg-white text-black px-4 py-2 rounded-full text-sm font-medium"
                >
                  Découvrir
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
