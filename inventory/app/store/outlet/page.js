"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal, Heart, X } from "lucide-react"

// Mock data for outlet products
const outletProducts = [
  {
    id: 1,
    name: "T-shirt Oversize",
    brand: "Nike",
    originalPrice: 49.99,
    salePrice: 29.99,
    discount: 40,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
  },
  {
    id: 2,
    name: "Sweatshirt à Capuche",
    brand: "Adidas",
    originalPrice: 89.99,
    salePrice: 44.99,
    discount: 50,
    image: "/placeholder.svg?height=400&width=300",
    isNew: true,
  },
  {
    id: 3,
    name: "Pantalon Jogger",
    brand: "Puma",
    originalPrice: 69.99,
    salePrice: 34.99,
    discount: 50,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
  },
  {
    id: 4,
    name: "Veste Légère",
    brand: "The North Face",
    originalPrice: 129.99,
    salePrice: 64.99,
    discount: 50,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
  },
  {
    id: 5,
    name: "Chaussures de Running",
    brand: "New Balance",
    originalPrice: 119.99,
    salePrice: 79.99,
    discount: 33,
    image: "/placeholder.svg?height=400&width=300",
    isNew: true,
  },
  {
    id: 6,
    name: "Sac à Dos",
    brand: "Eastpak",
    originalPrice: 59.99,
    salePrice: 39.99,
    discount: 33,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
  },
  {
    id: 7,
    name: "Chemise en Lin",
    brand: "Zara",
    originalPrice: 49.99,
    salePrice: 24.99,
    discount: 50,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
  },
  {
    id: 8,
    name: "Jean Slim",
    brand: "Levi's",
    originalPrice: 99.99,
    salePrice: 59.99,
    discount: 40,
    image: "/placeholder.svg?height=400&width=300",
    isNew: true,
  },
]

// Categories for filtering
const categories = [
  { id: "vetements", name: "Vêtements" },
  { id: "chaussures", name: "Chaussures" },
  { id: "accessoires", name: "Accessoires" },
  { id: "sport", name: "Sport" },
]

// Brands for filtering
const brands = [
  { id: "nike", name: "Nike" },
  { id: "adidas", name: "Adidas" },
  { id: "puma", name: "Puma" },
  { id: "tnf", name: "The North Face" },
  { id: "nb", name: "New Balance" },
  { id: "eastpak", name: "Eastpak" },
  { id: "zara", name: "Zara" },
  { id: "levis", name: "Levi's" },
]

export default function OutletPage() {
  const [priceRange, setPriceRange] = useState([0, 150])
  const [selectedSort, setSelectedSort] = useState("discount-desc")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleBrand = (brandId) => {
    setSelectedBrands((prev) => (prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]))
  }

  const clearAllFilters = () => {
    setPriceRange([0, 150])
    setSelectedCategories([])
    setSelectedBrands([])
    setShowNewOnly(false)
  }

  // In a real app, you would filter products based on the selected filters
  // For this example, we'll just use the mock data
  const filteredProducts = outletProducts.filter((product) => {
    if (showNewOnly && !product.isNew) return false
    if (product.salePrice < priceRange[0] || product.salePrice > priceRange[1]) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full h-[250px] sm:h-[350px] overflow-hidden">
        <Image
          src="/placeholder.svg?height=800&width=1600"
          alt="Outlet Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4">
          <Badge className="bg-red-600 hover:bg-red-700 mb-4 px-3 py-1 text-sm">OUTLET</Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Jusqu&apos;à -70%</h1>
          <p className="text-sm sm:text-base max-w-2xl text-center mb-6">
            Découvrez notre sélection de produits à prix réduits. Des offres exclusives sur vos marques préférées.
          </p>
          <Button className="bg-white text-black hover:bg-gray-100">Voir les offres</Button>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Filtres</h2>
                {(selectedCategories.length > 0 ||
                  selectedBrands.length > 0 ||
                  showNewOnly ||
                  priceRange[0] > 0 ||
                  priceRange[1] < 150) && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Prix (€)</h3>
                <Slider value={priceRange} min={0} max={150} step={5} onValueChange={setPriceRange} className="my-6" />
                <div className="flex justify-between text-sm">
                  <span>{priceRange[0]}€</span>
                  <span>{priceRange[1]}€</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Catégories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Marques</h3>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => toggleBrand(brand.id)}
                      />
                      <label
                        htmlFor={`brand-${brand.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Arrivals */}
              <div className="flex items-center space-x-2">
                <Checkbox id="new-only" checked={showNewOnly} onCheckedChange={setShowNewOnly} />
                <label
                  htmlFor="new-only"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nouveautés uniquement
                </label>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="flex-1">
            {/* Mobile Filter and Sort */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[350px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6">
                    {/* Price Range */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Prix (€)</h3>
                      <Slider
                        value={priceRange}
                        min={0}
                        max={150}
                        step={5}
                        onValueChange={setPriceRange}
                        className="my-6"
                      />
                      <div className="flex justify-between text-sm">
                        <span>{priceRange[0]}€</span>
                        <span>{priceRange[1]}€</span>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Catégories</h3>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-category-${category.id}`}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={() => toggleCategory(category.id)}
                            />
                            <label
                              htmlFor={`mobile-category-${category.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brands */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Marques</h3>
                      <div className="space-y-2">
                        {brands.map((brand) => (
                          <div key={brand.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-brand-${brand.id}`}
                              checked={selectedBrands.includes(brand.id)}
                              onCheckedChange={() => toggleBrand(brand.id)}
                            />
                            <label
                              htmlFor={`mobile-brand-${brand.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {brand.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* New Arrivals */}
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mobile-new-only" checked={showNewOnly} onCheckedChange={setShowNewOnly} />
                      <label
                        htmlFor="mobile-new-only"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Nouveautés uniquement
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                        Voir les résultats
                      </Button>
                      <Button variant="outline" onClick={clearAllFilters}>
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount-desc">Remise: Élevée à Basse</SelectItem>
                  <SelectItem value="discount-asc">Remise: Basse à Élevée</SelectItem>
                  <SelectItem value="price-asc">Prix: Bas à Élevé</SelectItem>
                  <SelectItem value="price-desc">Prix: Élevé à Bas</SelectItem>
                  <SelectItem value="newest">Nouveautés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Sort */}
            <div className="hidden md:flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Produits en Promotion</h2>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount-desc">Remise: Élevée à Basse</SelectItem>
                  <SelectItem value="discount-asc">Remise: Basse à Élevée</SelectItem>
                  <SelectItem value="price-asc">Prix: Bas à Élevé</SelectItem>
                  <SelectItem value="price-desc">Prix: Élevé à Bas</SelectItem>
                  <SelectItem value="newest">Nouveautés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || showNewOnly) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId)
                  return (
                    <Badge key={categoryId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                      {category?.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(categoryId)} />
                    </Badge>
                  )
                })}

                {selectedBrands.map((brandId) => {
                  const brand = brands.find((b) => b.id === brandId)
                  return (
                    <Badge key={brandId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                      {brand?.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleBrand(brandId)} />
                    </Badge>
                  )
                })}

                {showNewOnly && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    Nouveautés
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setShowNewOnly(false)} />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm">
                        <Heart className="h-4 w-4" />
                        <span className="sr-only">Add to wishlist</span>
                      </Button>
                    </div>
                    {product.discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700">-{product.discount}%</Badge>
                    )}
                    {product.isNew && (
                      <Badge className="absolute bottom-2 left-2 bg-green-600 hover:bg-green-700">Nouveau</Badge>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="text-sm font-bold">{product.salePrice.toFixed(2)}€</span>
                      <span className="text-xs text-gray-500 line-through">{product.originalPrice.toFixed(2)}€</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Aucun produit ne correspond à vos critères de recherche.</p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredProducts.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="outline">Voir plus de produits</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
