"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal, Heart, X, ShoppingBag, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import ProductDetailsModel from "../productsModel/[id]/page"
import { useWishlist } from "@/hooks/useWishlist"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb"
import axios from "axios"

const getPrimaryImage = (produit) => {
  if (!produit) return "/placeholder-image.jpg"
  if (produit.images_couleurs?.length > 0) {
    return produit.images_couleurs[0].image_url
  }
  if (produit.images?.length > 0) {
    return Array.isArray(produit.images) ? produit.images[0] : produit.images
  }
  return "/placeholder-image.jpg"
}

const estEnPromo = (produit) => {
  return produit.prix_final < produit.prix
}

export default function OutletPage() {
  const [priceRange, setPriceRange] = useState([0, 150])
  const [selectedSort, setSelectedSort] = useState("discount-desc")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageCourante, setPageCourante] = useState(1)
  const [quickBuyProduct, setQuickBuyProduct] = useState(null)
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: [],
    genres: [],
    sizes: [],
  })
  const [expandedCategories, setExpandedCategories] = useState({})

  const {
    basculerListeEnvies,
    estDansListeEnvies,
    chargement: chargementListeEnvies
  } = useWishlist()

  const organizeCategories = (categories) => {
    const categoryMap = {}
    const rootCategories = []

    categories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        subcategories: [],
      }
    })

    categories.forEach((category) => {
      if (category.parent_id) {
        const parent = categoryMap[category.parent_id]
        if (parent) parent.subcategories.push(categoryMap[category.id])
      } else {
        rootCategories.push(categoryMap[category.id])
      }
    })
    return rootCategories
  }

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [categoriesRes, brandsRes, genresRes] = await Promise.all([
        fetch("http://localhost:5000/categories").then(res => res.json()),
        fetch("http://localhost:5000/marques").then(res => res.json()),
        fetch("http://localhost:5000/genres").then(res => res.json()),
      ])

      setFilterOptions({
        categories: organizeCategories(Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || []),
        brands: Array.isArray(brandsRes) ? brandsRes : brandsRes.data || [],
        genres: Array.isArray(genresRes) ? genresRes : genresRes.data || [],
        sizes: []
      })

      const articlesRes = await fetch("http://localhost:5000/articles/obtenirArticlesEnRemise")
      if (!articlesRes.ok) throw new Error(`HTTP error! Status: ${articlesRes.status}`)
      
      const data = await articlesRes.json()
      const articles = Array.isArray(data) ? data : data.data || data.donnees || []

      if (articles.length > 0) {
        const prices = articles.map(a => a.prix_final)
        const minPrice = Math.floor(Math.min(...prices))
        const maxPrice = Math.ceil(Math.max(...prices))
        setPriceRange([minPrice, maxPrice])
      }

      setAllProducts(articles)
      setFilteredProducts(articles)
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error("Error loading discounted products.")
      setAllProducts([])
      setFilteredProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

/*   useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])
 */
/*   const applyFilters = useCallback(async (filtersToApply) => {
    setIsLoading(true)
    try {
      if (filtersToApply.length === 0 && !showNewOnly) {
        setFilteredProducts(allProducts)
        return
      }

      const response = await fetch("http://localhost:5000/articles/filtrerArticlesEnRemise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filtres: filtersToApply }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Filter request failed")
      }

      const data = await response.json()
      let filtered = Array.isArray(data) ? data : data.data || data.donnees || []

      if (showNewOnly) {
        filtered = filtered.filter(p => p.isNew)
      }

      setFilteredProducts(filtered)
    } catch (error) {
      console.error("Error applying filters:", error)
      toast.error("Error filtering products.")
      setFilteredProducts(allProducts)
    } finally {
      setIsLoading(false)
    }
  }, [allProducts, showNewOnly]) */

useEffect(() => {
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Load filter options
      const [categoriesRes, brandsRes, genresRes] = await Promise.all([
        fetch("http://localhost:5000/categories").then(res => res.json()),
        fetch("http://localhost:5000/marques").then(res => res.json()),
        fetch("http://localhost:5000/genres").then(res => res.json()),
      ]);

      setFilterOptions({
        categories: organizeCategories(Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || []),
        brands: Array.isArray(brandsRes) ? brandsRes : brandsRes.data || [],
        genres: Array.isArray(genresRes) ? genresRes : genresRes.data || [],
        sizes: []
      });

      // Load discounted products
      const articlesRes = await fetch("http://localhost:5000/articles/obtenirArticlesEnRemise");
      const data = await articlesRes.json();
      const articles = Array.isArray(data) ? data : data.data || data.donnees || [];

      // Set initial price range
      if (articles.length > 0) {
        const prices = articles.map(a => a.prix_final);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([minPrice, maxPrice]);
      }

      // Set products directly without applying filters initially
      setAllProducts(articles);
      setFilteredProducts(articles);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Error loading discounted products");
    } finally {
      setIsLoading(false);
    }
  };

  fetchInitialData();
}, [fetchInitialData]);

const applyFilters = useCallback(async (filtersToApply) => {
  setIsLoading(true);
  try {
    // If no filters are selected, return all products
    if (filtersToApply.length === 0) {
      setFilteredProducts(allProducts);
      return;
    }

    const response = await fetch("http://localhost:5000/articles/filtrerArticlesEnRemise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filtres: filtersToApply }),
    });

    if (!response.ok) {
      throw new Error("Filter request failed");
    }

    const data = await response.json();
    const filtered = Array.isArray(data) ? data : data.data || data.donnees || [];
    
    // Apply additional client-side filtering if needed
    const finalFiltered = showNewOnly 
      ? filtered.filter(p => p.isNew)
      : filtered;

    setFilteredProducts(finalFiltered);
  } catch (error) {
    console.error("Error applying filters:", error);
    toast.error("Error filtering products");
    setFilteredProducts(allProducts);
  } finally {
    setIsLoading(false);
  }
}, [allProducts, showNewOnly]);

useEffect(() => {
  // Only apply filters if we have products loaded
  if (allProducts.length === 0) return;

  const filters = [];
  
  // Price filter
  if (priceRange[0] > 0 || priceRange[1] < 150) {
    filters.push({ 
      category: "Prix", 
      filter: { min: priceRange[0], max: priceRange[1] } 
    });
  }

  // Category filter
  selectedCategories.forEach(id => {
    const category = filterOptions.categories.find(c => c.id === id) ||
                   filterOptions.categories.flatMap(c => c.subcategories || []).find(sc => sc.id === id);
    if (category) {
      filters.push({ 
        category: "Catégories", 
        filter: category.libelle 
      });
    }
  });

  // Other filters (brands, genres, sizes) similarly...

  applyFilters(filters);
}, [
  priceRange, 
  selectedCategories, 
  selectedBrands, 
  selectedGenres, 
  selectedSizes, 
  showNewOnly, 
  applyFilters, 
  filterOptions,
  allProducts // Add this dependency
]);
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
      setPageCourante(1)
      return newSelection
    })
  }

  const handleToggleBrand = (brandId) => {
    setSelectedBrands((prev) => {
      const newSelection = prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
      setPageCourante(1)
      return newSelection
    })
  }

  const handleToggleGenre = (genreId) => {
    setSelectedGenres((prev) => {
      const newSelection = prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
      setPageCourante(1)
      if (newSelection.length > 0 && selectedCategories.length > 0) {
        fetchSizes(newSelection[0], selectedCategories[0])
      } else {
        setFilterOptions(prev => ({ ...prev, sizes: [] }))
      }
      return newSelection
    })
  }

  const handleToggleSize = (sizeId) => {
    setSelectedSizes((prev) => {
      const newSelection = prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
      setPageCourante(1)
      return newSelection
    })
  }

  const clearAllFilters = () => {
    setPriceRange([0, 150])
    setSelectedCategories([])
    setSelectedBrands([])
    setSelectedGenres([])
    setSelectedSizes([])
    setShowNewOnly(false)
    setPageCourante(1)
    setFilteredProducts(allProducts)
  }

  const fetchSizes = async (genreId, categoryId) => {
    if (!genreId || !categoryId) {
      setFilterOptions(prev => ({ ...prev, sizes: [] }))
      return
    }
    try {
      const response = await fetch(`http://localhost:5000/tailles?genre_id=${genreId}&categorie_id=${categoryId}`)
      const data = await response.json()
      setFilterOptions(prev => ({ ...prev, sizes: Array.isArray(data) ? data : data.data || [] }))
    } catch (error) {
      console.error("Error fetching sizes:", error)
      toast.error("Error loading sizes.")
      setFilterOptions(prev => ({ ...prev, sizes: [] }))
    }
  }

  const productsPerPage = 12
  const indexDernierProduit = pageCourante * productsPerPage
  const indexPremierProduit = indexDernierProduit - productsPerPage
  const currentProducts = filteredProducts.slice(indexPremierProduit, indexDernierProduit)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const handlePageChange = (value) => {
    setPageCourante(value)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const prepareProductForModal = (produit) => {
    if (!produit) return null
    const tailles = (produit.tailles || [])
      .map((t) => ({
        id: t.id,
        nom: t.libelle || t.nom,
        quantite: t.ArticleTaille?.quantite || 0,
      }))
      .filter((t) => t.quantite > 0)

    const marque = typeof produit.marque === "object" ? produit.marque?.libelle : produit.marque

    return {
      ...produit,
      marque,
      tailles,
      stock: tailles.reduce((sum, t) => sum + t.quantite, 0),
      primaryImage: getPrimaryImage(produit),
    }
  }

  const handleQuickBuyClick = (produit) => {
    if (!produit?.id) {
      toast.error("Invalid product data")
      return
    }
    setQuickBuyProduct(prepareProductForModal(produit))
  }

  const handleAddToCart = async ({ produit, tailleSelectionnee, quantite }) => {
    try {
      if (!produit?.id || !tailleSelectionnee?.id) {
        throw new Error("Produit ou taille invalide")
      }

      const response = await axios.post(
        "http://localhost:5000/panier/ajouterAuPanier",
        {
          articles: [
            {
              article_id: produit.id,
              quantite: quantite,
              taille_id: tailleSelectionnee.id,
              prix_au_moment_ajout: produit.prix_final || produit.prix,
            },
          ],
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        toast.success("Produit ajouté au panier avec succès")
        return true
      } else {
        toast.error(response.data.message || "Erreur lors de l'ajout au panier")
        return false
      }
    } catch (erreur) {
      console.error("Erreur lors de l'ajout au panier:", erreur)
      toast.error(erreur.response?.data?.message || "Erreur lors de l'ajout au panier")
      return false
    }
  }

  const handleQuickCheckout = async ({ produit, tailleSelectionnee }) => {
    const added = await handleAddToCart({
      produit,
      tailleSelectionnee,
      quantite: 1,
    })

    if (added) {
      window.location.href = "/caisse"
    }
  }

  const sortedProducts = [...currentProducts].sort((a, b) => {
    if (selectedSort === "discount-desc") {
      const discountA = a.prix > 0 ? ((a.prix - a.prix_final) / a.prix) * 100 : 0
      const discountB = b.prix > 0 ? ((b.prix - b.prix_final) / b.prix) * 100 : 0
      return discountB - discountA
    } else if (selectedSort === "discount-asc") {
      const discountA = a.prix > 0 ? ((a.prix - a.prix_final) / a.prix) * 100 : 0
      const discountB = b.prix > 0 ? ((b.prix - b.prix_final) / b.prix) * 100 : 0
      return discountA - discountB
    } else if (selectedSort === "price-asc") {
      return a.prix_final - b.prix_final
    } else if (selectedSort === "price-desc") {
      return b.prix_final - a.prix_final
    } else if (selectedSort === "newest") {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    return 0
  })

  return (
    <>
      <Breadcrumb />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative w-full h-[250px] sm:h-[350px] overflow-hidden bg-gray-100">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Badge className="bg-red-600 hover:bg-red-700 mb-4 px-3 py-1 text-sm">OUTLET</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Jusqu&apos;à -70%</h1>
            <p className="text-sm sm:text-base max-w-2xl text-center mb-6">
              Découvrez notre sélection de produits à prix réduits. Des offres exclusives sur vos marques préférées.
            </p>
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
                    selectedGenres.length > 0 ||
                    selectedSizes.length > 0 ||
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
                  <h3 className="text-sm font-medium">Prix ( DT)</h3>
                  <Slider 
                    value={priceRange} 
                    min={0} 
                    max={300} 
                    step={5} 
                    onValueChange={setPriceRange} 
                    className="my-6" 
                  />
                  <div className="flex justify-between text-sm">
                    <span>{priceRange[0]} DT</span>
                    <span>{priceRange[1]} DT</span>
                  </div>
                </div>

                {/* Genres */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Genres</h3>
                  <div className="space-y-2">
                    {filterOptions.genres.map((genre) => (
                      <div key={genre.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={() => handleToggleGenre(genre.id)}
                        />
                        <label
                          htmlFor={`genre-${genre.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {genre.libelle}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Catégories</h3>
                  <div className="space-y-2">
                    {filterOptions.categories.map((category) => (
                      <div key={category.id}>
                        <div 
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <span className="text-sm font-medium">{category.libelle}</span>
                          {expandedCategories[category.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                        {expandedCategories[category.id] && category.subcategories && (
                          <div className="ml-3 mt-1 space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`subcategory-${subcategory.id}`}
                                  checked={selectedCategories.includes(subcategory.id)}
                                  onCheckedChange={() => handleToggleCategory(subcategory.id)}
                                />
                                <label
                                  htmlFor={`subcategory-${subcategory.id}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {subcategory.libelle}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                {selectedGenres.length > 0 && selectedCategories.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Tailles</h3>
                    <div className="space-y-2">
                      {filterOptions.sizes.length > 0 ? (
                        filterOptions.sizes.map((size) => (
                          <div key={size.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`size-${size.id}`}
                              checked={selectedSizes.includes(size.id)}
                              onCheckedChange={() => handleToggleSize(size.id)}
                            />
                            <label
                              htmlFor={`size-${size.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {size.libelle}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">Aucune taille disponible pour cette sélection.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Brands */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Marques</h3>
                  <div className="space-y-2">
                    {filterOptions.brands.map((brand) => (
                      <div key={brand.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand.id}`}
                          checked={selectedBrands.includes(brand.id)}
                          onCheckedChange={() => handleToggleBrand(brand.id)}
                        />
                        <label
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {brand.libelle}
                        </label>
                      </div>
                    ))}
                  </div>
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
                      {/* Price Range (Mobile) */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Prix ( DT)</h3>
                        <Slider
                          value={priceRange}
                          min={0}
                          max={300}
                          step={5}
                          onValueChange={setPriceRange}
                          className="my-6"
                        />
                        <div className="flex justify-between text-sm">
                          <span>{priceRange[0]} DT</span>
                          <span>{priceRange[1]} DT</span>
                        </div>
                      </div>

                      {/* Genres (Mobile) */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Genres</h3>
                        <div className="space-y-2">
                          {filterOptions.genres.map((genre) => (
                            <div key={genre.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`mobile-genre-${genre.id}`}
                                checked={selectedGenres.includes(genre.id)}
                                onCheckedChange={() => handleToggleGenre(genre.id)}
                              />
                              <label
                                htmlFor={`mobile-genre-${genre.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {genre.libelle}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Categories (Mobile) */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Catégories</h3>
                        <div className="space-y-2">
                          {filterOptions.categories.map((category) => (
                            <div key={category.id}>
                              <div 
                                className="flex items-center justify-between cursor-pointer py-1"
                                onClick={() => toggleCategory(category.id)}
                              >
                                <span className="text-sm font-medium">{category.libelle}</span>
                                {expandedCategories[category.id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                              {expandedCategories[category.id] && category.subcategories && (
                                <div className="ml-3 mt-1 space-y-1">
                                  {category.subcategories.map((subcategory) => (
                                    <div key={subcategory.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`mobile-subcategory-${subcategory.id}`}
                                        checked={selectedCategories.includes(subcategory.id)}
                                        onCheckedChange={() => handleToggleCategory(subcategory.id)}
                                      />
                                      <label
                                        htmlFor={`mobile-subcategory-${subcategory.id}`}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {subcategory.libelle}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sizes (Mobile) */}
                      {selectedGenres.length > 0 && selectedCategories.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium">Tailles</h3>
                          <div className="space-y-2">
                            {filterOptions.sizes.length > 0 ? (
                              filterOptions.sizes.map((size) => (
                                <div key={size.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`mobile-size-${size.id}`}
                                    checked={selectedSizes.includes(size.id)}
                                    onCheckedChange={() => handleToggleSize(size.id)}
                                  />
                                  <label
                                    htmlFor={`mobile-size-${size.id}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {size.libelle}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500">Aucune taille disponible pour cette sélection.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Brands (Mobile) */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Marques</h3>
                        <div className="space-y-2">
                          {filterOptions.brands.map((brand) => (
                            <div key={brand.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`mobile-brand-${brand.id}`}
                                checked={selectedBrands.includes(brand.id)}
                                onCheckedChange={() => handleToggleBrand(brand.id)}
                              />
                              <label
                                htmlFor={`mobile-brand-${brand.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {brand.libelle}
                              </label>
                            </div>
                          ))}
                        </div>
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
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount-desc">Promo: - élevée</SelectItem>
                    <SelectItem value="discount-asc">Promo: + élevée</SelectItem>
                    <SelectItem value="price-desc">Prix: - élevé</SelectItem>
                    <SelectItem value="price-asc">Prix: + élevé</SelectItem>
                    <SelectItem value="newest">Nouveautés</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Sort */}
            <div className="hidden md:flex justify-between items-center mb-6">
  <h2 className="text-xl font-semibold">Produits en Promotion</h2>
  {/* Add animate-bounce here */}
  <span className="animate-bounce text-red-600 font-bold">
    ({filteredProducts.length})
  </span>
</div>

              {/* Active Filters Display */}
              {(selectedCategories.length > 0 || selectedBrands.length > 0 || selectedGenres.length > 0 || selectedSizes.length > 0 || showNewOnly) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategories.map((categoryId) => {
                    const category = filterOptions.categories.find((c) => c.id === categoryId) ||
                      filterOptions.categories.flatMap(c => c.subcategories || []).find(sc => sc.id === categoryId)
                    return (
                      <Badge key={categoryId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                        {category?.libelle}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleCategory(categoryId)} />
                      </Badge>
                    )
                  })}

                  {selectedBrands.map((brandId) => {
                    const brand = filterOptions.brands.find((b) => b.id === brandId)
                    return (
                      <Badge key={brandId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                        {brand?.libelle}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleBrand(brandId)} />
                      </Badge>
                    )
                  })}

                  {selectedGenres.map((genreId) => {
                    const genre = filterOptions.genres.find((g) => g.id === genreId)
                    return (
                      <Badge key={genreId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                        {genre?.libelle}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleGenre(genreId)} />
                      </Badge>
                    )
                  })}

                  {selectedSizes.map((sizeId) => {
                    const size = filterOptions.sizes.find((s) => s.id === sizeId)
                    return (
                      <Badge key={sizeId} variant="outline" className="flex items-center gap-1 px-3 py-1">
                        {size?.libelle}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleSize(sizeId)} />
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

              {isLoading ? (
                <div className="w-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  {/* Products Grid */}
                  {sortedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {sortedProducts.map((product) => (
                        <div key={product.id || Math.random()} className="group relative">
                          <div className="aspect-square overflow-hidden rounded-md bg-gray-50 relative">
                            <Link href={`/store/products/${product.id}`} className="block h-full w-full">
                              <Image
                                src={getPrimaryImage(product) || "/placeholder.svg"}
                                alt={product.nom_produit || "Product Image"}
                                width={400}
                                height={400}
                                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder-image.jpg"
                                }}
                              />
                            </Link>

                            {estEnPromo(product) && (
                              <Badge className="absolute top-2 left-2 bg-red-600 text-white font-mono text-xs">EN PROMO</Badge>
                            )}
                          </div>

                          <div className="mt-3 text-center relative">
                            <p className="text-xs text-gray-600 font-mono tracking-wider uppercase transition-opacity duration-300">
                              {product.marque?.libelle || "Unknown Brand"}
                            </p>
                            <h3 className="mt-1 text-sm font-medium text-gray-900 font-mono group-hover:opacity-0 transition-opacity duration-300">
                              {product.nom_produit || "Untitled Product"}
                            </h3>
                            <div className="mt-1 flex justify-center items-center gap-2">
                              {estEnPromo(product) && (
                                <>
                                  <p className="text-sm font-semibold text-gray-400 font-mono line-through">
                                    {product.prix?.toFixed(2)} DT
                                  </p>
                                  <p className="text-sm font-semibold text-red-600 font-mono">
                                    {product.prix_final?.toFixed(2)} DT
                                  </p>
                                </>
                              )}
                              {!estEnPromo(product) && (
                                <p className="text-sm font-semibold text-gray-900 font-mono">
                                  {product.prix_final?.toFixed(2) || product.prix?.toFixed(2) || 0} DT
                                </p>
                              )}
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-3 pt-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex gap-2 w-full">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 bg-black hover:bg-white hover:text-black border border-black text-white text-xs rounded-full"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleQuickBuyClick(product)
                                  }}
                                >
                                  Achat Rapide
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className={`h-8 w-8 rounded-full bg-white ${estDansListeEnvies(product.id) ? 'text-red-500' : 'text-gray-500'}`}
                                  onClick={async (e) => {
                                    e.preventDefault()
                                    await basculerListeEnvies(product.id)
                                  }}
                                  disabled={chargementListeEnvies}
                                >
                                  <Heart
                                    className="h-5 w-5"
                                    fill={estDansListeEnvies(product.id) ? 'currentColor' : 'none'}
                                  />
                                  <span className="sr-only">Ajouter aux favoris</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">Aucun produit ne correspond à vos critères de recherche.</p>
                      <Button variant="outline" onClick={clearAllFilters}>
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-10">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (pageCourante > 1) handlePageChange(pageCourante - 1)
                          } }
                          className={pageCourante === 1 ? "pointer-events-none opacity-50" : ""} />
                      </PaginationItem>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={pageNum === pageCourante}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(pageNum)
                              } }
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {totalPages > 5 && (
                        <>
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              isActive={totalPages === pageCourante}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(totalPages)
                              } }
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (pageCourante < totalPages) handlePageChange(pageCourante + 1)
                          } }
                          className={pageCourante === totalPages ? "pointer-events-none opacity-50" : ""} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Buy Dialog */}
      <Dialog open={!!quickBuyProduct} onOpenChange={(open) => !open && setQuickBuyProduct(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="sm:hidden sticky top-0 bg-white z-10 p-4 border-b">
            <DialogTitle>Achat Rapide</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          {quickBuyProduct && (
            <ProductDetailsModel
              productId={quickBuyProduct.id}
              onAddToCart={handleAddToCart}
              onQuickBuy={handleQuickCheckout}
              customButtons={({ product, selectedSize, isAddingToCart }) => (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    className={`flex items-center gap-2 ${!selectedSize || product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={async () => {
                      const added = await handleAddToCart({
                        produit: product,
                        tailleSelectionnee: selectedSize,
                        quantite: 1,
                      })
                      if (added) {
                        setQuickBuyProduct(null)
                      }
                    } }
                    disabled={!selectedSize || product.stock <= 0 || isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Ajouter au panier
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    className={`${!selectedSize || product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={async () => {
                      await handleQuickCheckout({ produit: product, tailleSelectionnee: selectedSize })
                    } }
                    disabled={!selectedSize || product.stock <= 0 || isAddingToCart}
                  >
                    Achetez maintenant
                  </Button>
                </div>
              )} />
          )}
        </DialogContent>
      </Dialog>
    </div></>
  );
}