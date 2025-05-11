"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft } from "lucide-react"
import Image from "next/image"

export default function AutoSlider() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("http://localhost:5000/articles")
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        if (!data.success || !Array.isArray(data.donnees)) {
          throw new Error("Unexpected API response structure")
        }

        setProducts(data.donnees.slice(0, 6))
      } catch (error) {
        console.error("Error fetching products:", error)
        // Fallback data in case the API fails
        setProducts([
          { id: 1, nom: "Pull Oversize", images_couleurs: [{ image_url: "/DINA-ORANGE-3-.jpg" }] },
          { id: 2, nom: "Pull Blanc", images_couleurs: [{ image_url: "/DINA-BLANC-1-.jpg" }] },
          { id: 3, nom: "Pull Marron", images_couleurs: [{ image_url: "/DINA-MARRON-2A-.jpg" }] },
          { id: 4, nom: "Pull Violet", images_couleurs: [{ image_url: "/DINA-VIOLET-1.jpg" }] },
          { id: 5, nom: "Pull Orange", images_couleurs: [{ image_url: "/DINA-ORANGE-1-.jpg" }] },
          { id: 6, nom: "Chemise", images_couleurs: [{ image_url: "/chemise1.jpg" }] },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [products])

  const scrollLeft = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? products.length - 1 : prevIndex - 1))
  }

  const scrollRight = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length)
  }

  if (isLoading) {
    return (
      <section className="flex justify-center items-center h-96 mt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </section>
    )
  }

  return (
    <section className="flex flex-col lg:flex-row items-center lg:items-start justify-between px-4 sm:px-6 lg:px-10 mt-24 lg:mt-16 gap-6 lg:gap-10">
      {/* LEFT TEXT SECTION */}
      <div className="flex flex-col w-full lg:w-[45%] text-center lg:text-left">
        <div className="text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-[2px] font-bold uppercase">
          <span className="block">NOUVELLE </span>
          <span className="block">COLLECTION</span>
        </div>

        <div className="mt-2 font-light tracking-[2px] text-lg">
          <span className="block">Printemps</span>
          <span className="block">2025</span>
        </div>

        <div className="mt-8 lg:mt-24 flex flex-col sm:flex-row items-center gap-6">
          <button
            className="flex items-center border border-gray-300 px-5 py-2 bg-[#D9D9D9] cursor-pointer hover:bg-gray-300 transition-colors"
            onClick={() => router.push("/store/produits")}
          >
            <span className="text-[16px]">Aller à la boutique</span>
            <ChevronRight className="ml-2 animate-pulse" />
          </button>

          <div className="flex gap-2 mt-4 sm:mt-0 sm:ml-auto">
            <button
              onClick={scrollLeft}
              className="border h-10 w-10 border-gray-400 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollRight}
              className="border h-10 w-10 border-gray-400 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE SLIDER */}
      <div className="w-full lg:w-[50%] overflow-hidden relative rounded-xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map((product, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <Image
                width={600}
                height={500}
                src={product.images_couleurs?.[0]?.image_url || "/placeholder.jpg"}
                alt={product.nom || "Product"}
                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
              />
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index ? "w-8 bg-black" : "w-2 bg-gray-400"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
