"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb";
import PetitProductList from "./PetitProductList";
import FilterbarPetitPrix from "@/app/components/Product/FilterbarPetitPrix";

const PetitPrixPage = () => {
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
        // Use the new petits-prix endpoint
        const response = await fetch("http://localhost:5000/articles/petits-prix")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        const produits = Array.isArray(data) ? data : data.data || []

        setProduits(produits)
        setProduitsFiltres(produits)
      } catch (erreur) {
        console.error("Error loading products:", erreur)
        toast.error("Erreur lors du chargement des produits")
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

      // Filter locally since we already have the petits-prix products
      let resultatsFiltres = [...produits]

      filtres.forEach(({ category, filter }) => {
        switch (category) {
          case "Prix":
            resultatsFiltres = resultatsFiltres.filter(
              (produit) => produit.prix_final >= filter.min && produit.prix_final <= filter.max
            )
            break
          case "Genres":
            resultatsFiltres = resultatsFiltres.filter(
              (produit) => produit.genre?.libelle === filter
            )
            break
          case "Catégories":
            resultatsFiltres = resultatsFiltres.filter(
              (produit) => produit.categorie?.libelle === filter
            )
            break
          case "Tailles":
            resultatsFiltres = resultatsFiltres.filter((produit) =>
              produit.tailles?.some((t) => t.libelle === filter)
            )
            break
          case "Marques":
            resultatsFiltres = resultatsFiltres.filter(
              (produit) => produit.marque?.libelle === filter
            )
            break
          default:
            break
        }
      })

      setProduitsFiltres(resultatsFiltres)
    } catch (erreur) {
      console.error("Filter error:", erreur)
      toast.error("Erreur lors du filtrage des produits")
      setProduitsFiltres(produits)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen pb-10 md:pb-20">
      <Breadcrumb />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-sm sm:text-base md:text-lg font-serif font-semibold mb-3 uppercase tracking-wider">
            Mode Enfant Abordable
          </h1>
          <p className="font-mono text-xs md:text-sm text-gray-600 max-w-2xl mx-auto">
            Explorez une collection exclusive des marques de mode enfant les plus prestigieuses. Pour la saison printemps-été, découvrez des essentiels du style signés CLARNE&apos;S, TLILA, HUGO, BOSS, O&apos;SPELLA, TED, CHLOÉ, P&apos;tit Frimeur, KENZO et LANVIN. Des pièces haut de gamme qui allient tendance, raffinement et modernité pour des looks uniques et élégants.
          </p>
        </div>

        <FilterbarPetitPrix
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
          <PetitProductList produits={produitsFiltres} onEffacerTousFiltres={handleEffacerTousFiltres} />
        )}
      </div>
    </section>
  )
}

export default PetitPrixPage