"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, ChevronDown } from "lucide-react"

// Mock data for luxury brands
const luxuryBrands = [
  { id: 1, name: "Louis Vuitton", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 2, name: "Gucci", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 3, name: "Chanel", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 4, name: "Dior", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 5, name: "Prada", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 6, name: "Hermès", logo: "/placeholder.svg?height=60&width=120", featured: true },
  { id: 7, name: "Balenciaga", logo: "/placeholder.svg?height=60&width=120", featured: false },
  { id: 8, name: "Versace", logo: "/placeholder.svg?height=60&width=120", featured: false },
]

// Mock data for luxury collections
const luxuryCollections = [
  {
    id: 1,
    title: "Collection Automne-Hiver",
    description: "Découvrez notre sélection exclusive de pièces de luxe pour la saison froide.",
    image: "/placeholder.svg?height=600&width=800",
    category: "femme",
  },
  {
    id: 2,
    title: "Accessoires Intemporels",
    description: "Des accessoires de luxe qui traversent les saisons et les tendances.",
    image: "/placeholder.svg?height=600&width=800",
    category: "accessoires",
  },
  {
    id: 3,
    title: "Montres & Joaillerie",
    description: "L'excellence horlogère et les plus belles pièces de joaillerie.",
    image: "/placeholder.svg?height=600&width=800",
    category: "montres",
  },
  {
    id: 4,
    title: "Parfums d'Exception",
    description: "Des fragrances rares et précieuses pour une signature olfactive unique.",
    image: "/placeholder.svg?height=600&width=800",
    category: "parfums",
  },
]

// Mock data for featured products
const featuredProducts = [
  {
    id: 1,
    name: "Sac à Main Classic",
    brand: "Chanel",
    price: 4500,
    image: "/placeholder.svg?height=400&width=300",
    category: "accessoires",
  },
  {
    id: 2,
    name: "Montre Nautilus",
    brand: "Patek Philippe",
    price: 35000,
    image: "/placeholder.svg?height=400&width=300",
    category: "montres",
  },
  {
    id: 3,
    name: "Robe Soirée",
    brand: "Dior",
    price: 3800,
    image: "/placeholder.svg?height=400&width=300",
    category: "femme",
  },
  {
    id: 4,
    name: "Costume Sur Mesure",
    brand: "Tom Ford",
    price: 5200,
    image: "/placeholder.svg?height=400&width=300",
    category: "homme",
  },
  {
    id: 5,
    name: "Parfum Exclusif",
    brand: "Hermès",
    price: 280,
    image: "/placeholder.svg?height=400&width=300",
    category: "parfums",
  },
  {
    id: 6,
    name: "Lunettes de Soleil",
    brand: "Gucci",
    price: 450,
    image: "/placeholder.svg?height=400&width=300",
    category: "accessoires",
  },
]

export default function LuxePage() {
  const [activeTab, setActiveTab] = useState("all")
  const [isScrolled, setIsScrolled] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setIsScrolled(heroBottom < 0)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const filteredProducts =
    activeTab === "all" ? featuredProducts : featuredProducts.filter((product) => product.category === activeTab)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative w-full h-[70vh] min-h-[500px] overflow-hidden flex items-center justify-center"
      >
        <Image
          src="/placeholder.svg?height=1080&width=1920"
          alt="Luxury Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl">
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-none mb-4">COLLECTION LUXE</Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">L&apos;Excellence du Luxe</h1>
          <p className="text-sm sm:text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Découvrez notre sélection exclusive des plus grandes maisons de luxe. Des pièces d&apos;exception pour une
            élégance intemporelle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-black hover:bg-gray-100">Découvrir la collection</Button>
            <Button variant="outline" className="text-white border-white hover:bg-white/20">
              Nos marques
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white" />
        </div>
      </section>

      {/* Sticky Navigation (appears after scrolling past hero) */}
      <div
        className={`sticky top-0 z-20 bg-white border-b transition-all duration-300 ${
          isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Collection Luxe</h2>
          <div className="flex gap-4">
            <Button variant="outline" size="sm">
              Nos marques
            </Button>
            <Button size="sm">Voir la collection</Button>
          </div>
        </div>
      </div>

      {/* Featured Brands */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Nos Maisons de Luxe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center">
          {luxuryBrands
            .filter((brand) => brand.featured)
            .map((brand) => (
              <Link key={brand.id} href={`/luxe/brands/${brand.id}`} className="group flex flex-col items-center">
                <div className="relative w-full h-16 mb-3 grayscale transition-all duration-300 group-hover:grayscale-0">
                  <Image src={brand.logo || "/placeholder.svg"} alt={brand.name} fill className="object-contain" />
                </div>
                <h3 className="text-sm font-medium text-center">{brand.name}</h3>
              </Link>
            ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" className="group">
            Voir toutes nos marques
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Luxury Collections */}
      <section className="py-16 bg-gray-50">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Collections Exclusives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {luxuryCollections.map((collection) => (
              <Card key={collection.id} className="overflow-hidden border-none shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{collection.title}</h3>
                    <p className="text-sm sm:text-base mb-4">{collection.description}</p>
                    <Button className="bg-white text-black hover:bg-gray-100">Découvrir</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Pièces d&apos;Exception</h2>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2">
                Tous
              </TabsTrigger>
              <TabsTrigger value="femme" className="text-xs sm:text-sm py-2">
                Femme
              </TabsTrigger>
              <TabsTrigger value="homme" className="text-xs sm:text-sm py-2">
                Homme
              </TabsTrigger>
              <TabsTrigger value="accessoires" className="text-xs sm:text-sm py-2">
                Accessoires
              </TabsTrigger>
              <TabsTrigger value="montres" className="text-xs sm:text-sm py-2">
                Montres
              </TabsTrigger>
              <TabsTrigger value="parfums" className="text-xs sm:text-sm py-2">
                Parfums
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/luxe/products/${product.id}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-medium">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.brand}</p>
              <p className="text-sm font-semibold mt-1">{product.price.toLocaleString()} €</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button>Voir toute la collection</Button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-black text-white">
        <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Restez informé</h2>
          <p className="text-gray-300 mb-8">
            Inscrivez-vous à notre newsletter pour recevoir en avant-première nos nouvelles collections et offres
            exclusives.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-2 rounded-md text-black"
              required
            />
            <Button className="bg-white text-black hover:bg-gray-200">S&apos;inscrire</Button>
          </form>
        </div>
      </section>
    </div>
  )
}
