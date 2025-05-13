"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb";
import HommeProductList from "./HommeProductList";
import FilterBarHomme from "@/app/components/Product/FilterBarHomme";

const HommePage = () => {
  const pathname = usePathname() || ""
  const [isScrolling, setIsScrolling] = useState(false)
  const [filtresSelectionnes, setFiltresSelectionnes] = useState([])
  const [produitsFiltres, setProduitsFiltres] = useState([])
  const [produits, setProduits] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const chargerProduits = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("http://localhost:5000/articles/obtenirArticlesHomme") // Updated endpoint

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        const produits = Array.isArray(data) ? data : data.data || data.donnees || []

        setProduits(produits)
        setProduitsFiltres(produits)
      } catch (erreur) {
        console.error("Error loading products:", erreur)
        toast.error("Error loading products")
      } finally {
        setIsLoading(false)
      }
    }

    chargerProduits()
  }, [])

  const handleSelectionFiltre = (category, filter) => {
    setFiltresSelectionnes((prev) => {
      const existingFilter = prev.find((f) => f.category === category)
      if (existingFilter) {
        const nouveauxFiltres = prev.map((f) => (f.category === category ? { category, filter } : f))
        appliquerFiltres(nouveauxFiltres)
        return nouveauxFiltres
      } else {
        const nouveauxFiltres = [...prev, { category, filter }]
        appliquerFiltres(nouveauxFiltres)
        return nouveauxFiltres
      }
    })
  }

  const handleSuppressionFiltre = (filterASupprimer) => {
    setFiltresSelectionnes((prev) => {
      const nouveauxFiltres = prev.filter((f) =>
        typeof f.filter === "object"
          ? f.filter.min !== filterASupprimer.min || f.filter.max !== filterASupprimer.max
          : f.filter !== filterASupprimer,
      )
      appliquerFiltres(nouveauxFiltres)
      return nouveauxFiltres
    })
  }

  const handleEffacerTousFiltres = () => {
    setFiltresSelectionnes([])
    setProduitsFiltres(produits)
  }

  const appliquerFiltres = async (filtres) => {
    try {
      setIsLoading(true)

      if (filtres.length === 0) {
        setProduitsFiltres(produits)
        return
      }

      const response = await fetch("http://localhost:5000/articles/filtrerArticlesGHomme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filtres }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Filter request failed")
      }

      const data = await response.json()
      const donneesFiltrees = Array.isArray(data) ? data : data.data || data.donnees || []
      setProduitsFiltres(donneesFiltrees)
    } catch (erreur) {
      console.error("Filter error:", erreur)
      toast.error("Error filtering products")
      setProduitsFiltres(produits)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen pb-10 md:pb-20 ">
      <Breadcrumb />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-sm sm:text-base md:text-lg font-serif font-semibold mb-3 uppercase tracking-wider">
            Nouvelles collections Homme
          </h1>
          <p className="font-mono text-xs md:text-sm text-gray-600 max-w-2xl mx-auto">
            Découvrez les nouvelles collections Printemps-Été 2025 des plus belles marques
          </p>
        </div>

        <FilterBarHomme
          filtresSelectionnes={filtresSelectionnes}
          onSelectionFiltre={handleSelectionFiltre}
          onSuppressionFiltre={handleSuppressionFiltre}
          onEffacerTousFiltres={handleEffacerTousFiltres}
          totalProduits={produitsFiltres.length}
          isScrolling={isScrolling}
          pathname={pathname}
        />

        {isLoading ? (
          <div className="w-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <HommeProductList produits={produitsFiltres} onEffacerTousFiltres={handleEffacerTousFiltres} />
        )}
      </div>
    </section>
  )
}

export default HommePage
