"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Produit() {
  const router = useRouter()
  const [featuredProduct, setFeaturedProduct] = useState(null)
  const [colorVariations, setColorVariations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDailyProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:5000/articles/obtenirArticleQuotidien')
        const data = await response.json()
        
        if (data.success && data.donnees) {
          setFeaturedProduct(data.donnees)
          
          // Extract the first 4 color variations
          const variations = Object.entries(data.donnees.images_par_couleur)
            .slice(0, 4)
            .map(([colorId, images]) => ({
              colorId,
              imageUrl: images[0], // Take the first image for each color
              colorName: data.donnees.couleurs.find(c => c.id === parseInt(colorId))?.libelle || ''
            }))
          
          setColorVariations(variations)
        }
      } catch (error) {
        console.error("Error fetching daily product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDailyProduct()
  }, [])

  if (loading) {
    return (
      <section className="container mx-auto px-4 mt-16 lg:mt-24">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
          {/* Loading skeleton */}
          <div className="w-full lg:w-1/2 h-[500px] bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-1/2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[200px] bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!featuredProduct) {
    return (
      <section className="container mx-auto px-4 mt-16 lg:mt-24">
        <div className="text-center py-10">
          <p>Aucun produit vedette disponible aujourd'hui</p>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 mt-16 lg:mt-24">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
        {/* Left Featured Product */}
        <div className="relative flex flex-col items-center w-full lg:w-1/2">
          <div className="overflow-hidden w-full h-[400px] sm:h-[500px] cursor-pointer rounded-lg">
            {featuredProduct.images_couleurs[0]?.image_url && (
              <Image
                src={featuredProduct.images_couleurs[0].image_url}
                alt={featuredProduct.nom_produit}
                width={500} height={750}
                className="w-full h-[120%] object-contain transition-transform duration-500 ease-out hover:scale-105"
              />
            )}
          </div>
          <div className="relative -mt-10 bg-white p-4 sm:p-6 shadow-lg w-[85%] sm:w-[80%] text-center">
            <h3 className="text-sm sm:text-base font-normal uppercase">
              {featuredProduct.nom_produit}
              {featuredProduct.marque && ` x ${featuredProduct.marque.libelle}`}
            </h3>
            <p className="text-xs mt-2 font-light font-mono">
              {featuredProduct.description || "Découvrez ce produit exceptionnel."}
            </p>
            <button
              className="mt-3 px-5 py-2 border-black border-2 text-black font-serif tracking-widest text-xs hover:bg-gray-200 transition"
              onClick={() => router.push(`/store/products/${featuredProduct.id}`)}
            >
              DÉCOUVRIR
            </button>
          </div>
        </div>

        {/* Right Product Grid - Color Variations */}
        <div className="grid grid-cols-2 gap-4 w-full lg:w-1/2">
          {colorVariations.map((variation, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="overflow-hidden w-full h-[180px] sm:h-[200px] cursor-pointer rounded-lg">
                <Image
                  src={variation.imageUrl}
                  alt={`${featuredProduct.nom_produit} - ${variation.colorName}`}
                  width={500}
                  height={256}
                  className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
                  onClick={() => router.push(`/store/products/${featuredProduct.id}?color=${variation.colorId}`)}
                />
              </div>
              <span className="bg-black text-white text-xs font-serif animate-bounce tracking-widest px-2 py-1 mt-2">
                VARIATION
              </span>
              <h3 className="text-xs sm:text-sm font-semibold tracking-widest mt-2">
                {featuredProduct.marque?.libelle || 'MARQUE'}
              </h3>
              <p className="text-xs font-serif tracking-widest">{variation.colorName}</p>
              <p className="text-xs sm:text-sm font-serif tracking-widest mt-1">
                {featuredProduct.prix_final.toFixed(2)} DT
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}