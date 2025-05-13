"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2 } from "lucide-react"
import useMarques from "@/hooks/useMarques"
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb"

export default function MarquePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  
  const {
    randomMarques,
    popularMarques,
    marquesByGenre,
    isLoadingRandom,
    isLoadingPopular,
    isLoadingByGenre,
    errorRandom,
    errorPopular,
    errorByGenre,
    getMarquesByGenre
  } = useMarques()

  // Fetch marques by genre when tab changes
  useEffect(() => {
    if (activeCategory !== "all") {
      getMarquesByGenre(activeCategory)
    }
  }, [activeCategory, getMarquesByGenre])

  // Filter brands based on search query
  const filterBrands = (brands) => {
    if (!searchQuery) return brands
    return brands.filter(brand => 
      brand.libelle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Group brands alphabetically
  const groupBrandsAlphabetically = (brands) => {
    const grouped = {}
    brands.forEach(brand => {
      const firstLetter = brand.libelle.charAt(0).toUpperCase()
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = []
      }
      grouped[firstLetter].push(brand)
    })
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, brands]) => ({ letter, brands }))
  }

  // Get content for current tab
  const getTabContent = () => {
    switch (activeCategory) {
      case "femme":
      case "homme":
      case "garcon":
      case "fille":
        const genreData = marquesByGenre(activeCategory)
        if (isLoadingByGenre(activeCategory)) {
          return (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )
        }
        if (errorByGenre(activeCategory)) {
          return (
            <div className="text-center py-10">
              <p className="text-red-500">{errorByGenre(activeCategory)}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => getMarquesByGenre(activeCategory)}
              >
                Réessayer
              </Button>
            </div>
          )
        }
        if (!genreData?.marques?.length) {
          return (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune marque trouvée pour cette catégorie</p>
            </div>
          )
        }
        const filteredGenreBrands = filterBrands(genreData.marques)
        if (!filteredGenreBrands.length) {
          return (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune marque trouvée pour &quot;{searchQuery}&quot;</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                Réinitialiser la recherche
              </Button>
            </div>
          )
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredGenreBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )
      
      default: // "all"
        const allBrands = [...(popularMarques || []), ...(randomMarques || [])]
        const uniqueBrands = Array.from(new Map(allBrands.map(brand => [brand.id, brand])).values())
        const filteredBrands = filterBrands(Array.from(uniqueBrands))
        const groupedBrands = groupBrandsAlphabetically(filteredBrands)
        
        if (!groupedBrands.length) {
          return (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune marque trouvée pour &quot;{searchQuery}&quot;</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                Réinitialiser la recherche
              </Button>
            </div>
          )
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groupedBrands.map((group) => (
              <div key={group.letter} className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">{group.letter}</h3>
                <ul className="space-y-2">
                  {group.brands.map((brand) => (
                    <li key={brand.id}>
                      <Link
                        href={`/store/marques/${brand.id}`}
                        className="text-sm hover:text-gray-600 hover:underline"
                      >
                        {brand.libelle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <>
    <Breadcrumb/>
    <div className="min-h-screen ">
      {/* Hero Section */}
      <section className="relative lg:w-[96%] lg:ml-9 w-full   h-[300px] sm:h-[400px] overflow-hidden">

        <div className="absolute inset-0 flex flex-col items-center justify-center text-black p-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center  font-serif">Nos Marques</h1>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl text-center mb-6">
            Découvrez notre sélection de marques prestigieuses et trouvez les produits qui vous correspondent.
          </p>
          <div className="relative w-full max-w-md">
            <Input
              type="text"
              placeholder="Rechercher une marque..."
              className="pl-10 pr-4 py-2 rounded-full bg-white/90 text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </section>

      {/* Featured Brands Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Marques Populaires</h2>
        {isLoadingPopular ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : errorPopular ? (
          <div className="text-center py-10">
            <p className="text-red-500">{errorPopular}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filterBrands(popularMarques).slice(0, 6).map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </section>

      {/* All Brands Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Toutes les Marques</h2>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full justify-start border-b rounded-none h-auto">
              <TabsTrigger value="all" className="text-sm py-2 px-4">
                Toutes
              </TabsTrigger>
              <TabsTrigger value="homme" className="text-sm py-2 px-4">
                Homme
              </TabsTrigger>
              <TabsTrigger value="femme" className="text-sm py-2 px-4">
                Femme
              </TabsTrigger>
              <TabsTrigger value="garcon" className="text-sm py-2 px-4">
                Garçon
              </TabsTrigger>
              <TabsTrigger value="fille" className="text-sm py-2 px-4">
                Fille
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            {getTabContent()}
          </TabsContent>
          
          {["homme", "femme", "garcon", "fille"].map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              {getTabContent()}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
    </>
  )
}

function BrandCard({ brand }) {
  return (
    <Link
      href={`/store/marques/${brand.id}`}
      className="group flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      {brand.featured_image && (
        <div className="relative w-full h-16 mb-3">
          <Image 
            src={brand.featured_image} 
            alt={brand.libelle} 
            fill 
            className="object-contain" 
          />
        </div>
      )}
      <h3 className="text-sm font-medium text-center">{brand.libelle}</h3>
      {brand.article_count !== undefined && (
        <p className="text-xs text-gray-500 mt-1">{brand.article_count} produits</p>
      )}
    </Link>
  )
}