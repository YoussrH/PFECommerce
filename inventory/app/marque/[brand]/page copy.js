"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import useMarques from "@/hooks/useMarques"
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb"
import FilterBarMarque from "@/app/components/Product/FilterBarMarque"
import ProductListMarque from "@/app/store/marques/ProductListMarque"


export default function BrandDetailPage() {
  const { brand } = useParams()
  const [filters, setFilters] = useState([])
  const [isScrolling, setIsScrolling] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  
  const {
    marquesByGenre,
    articlesByMarque,
    isLoadingArticlesByMarque,
    errorArticlesByMarque,
    getArticlesByMarque
  } = useMarques()

  // Fetch articles by brand when page loads
  useEffect(() => {
    if (brand) {
      getArticlesByMarque(brand)
    }
  }, [brand, getArticlesByMarque])

  // Handle scroll for sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply filters to products
  useEffect(() => {
    if (articlesByMarque[brand]) {
      let products = [...articlesByMarque[brand]]
      
      filters.forEach(filter => {
        if (filter.category === 'Prix') {
          products = products.filter(p => 
            p.prix_final >= filter.filter.min && 
            p.prix_final <= filter.filter.max
          )
        } else if (filter.category === 'Genres') {
          products = products.filter(p => 
            p.genre?.libelle === filter.filter || 
            p.genre_id === filter.filter
          )
        } else if (filter.category === 'Catégories') {
          products = products.filter(p => 
            p.categorie?.libelle === filter.filter || 
            p.categorie_id === filter.filter
          )
        } else if (filter.category === 'Tailles') {
          products = products.filter(p => 
            p.tailles?.some(t => t.libelle === filter.filter)
          )
        }
      })
      
      setFilteredProducts(products)
    }
  }, [filters, articlesByMarque, brand])

  const handleFilterSelect = (category, filter) => {
    setFilters(prev => [...prev, { category, filter }])
  }

  const handleFilterRemove = (filterToRemove) => {
    setFilters(prev => 
      prev.filter(f => 
        typeof f.filter === 'object' 
          ? f.filter.min !== filterToRemove.min || f.filter.max !== filterToRemove.max
          : f.filter !== filterToRemove
      )
    )
  }

  const clearAllFilters = () => {
    setFilters([])
  }

  // Get brand data
  const brandData = marquesByGenre('all')?.marques?.find(m => m.id === brand) || 
                   articlesByMarque[brand]?.[0]?.marque

  return (
    <div className="min-h-screen">
      <Breadcrumb />
      
      {/* Brand Hero Section */}
      <section className="relative w-full h-[300px] sm:h-[400px] overflow-hidden ">
     <div className="text-center mb-16">
        <h1 className="text-3xl font-bold mb-8">LA MARQUE {currentBrand.name}</h1>
        <p className="max-w-3xl mx-auto text-gray-700">         Découvrez la Nouvelle collection , une parfaite alliance de couleurs vives et de styles ludiques {currentBrand.name}</p>

      </div>
      </section>

      {/* Filter and Product Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FilterBarMarque
          filtresSelectionnes={filters}
          onSelectionFiltre={handleFilterSelect}
          onSuppressionFiltre={handleFilterRemove}
          onEffacerTousFiltres={clearAllFilters}
          totalProduits={filteredProducts.length || articlesByMarque[brand]?.length || 0}
          isScrolling={isScrolling}
          hideMarqueFilter={true}
          pathname={`/marque/${brand}`}
        />

        {isLoadingArticlesByMarque ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : errorArticlesByMarque ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">Erreur lors du chargement des produits</p>
            <Button 
              variant="outline"
              onClick={() => getArticlesByMarque(brand)}
            >
              Réessayer
            </Button>
          </div>
        ) : (
          <ProductListMarque 
            produits={filteredProducts.length ? filteredProducts : articlesByMarque[brand] || []}
            onEffacerTousFiltres={clearAllFilters}
          />
        )}
      </section>
    </div>
  )
}