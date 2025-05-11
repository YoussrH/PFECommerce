"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { X, ChevronDown, Filter } from "lucide-react"

const FilterBarMarque = ({
  filtresSelectionnes,
  onSelectionFiltre,
  onSuppressionFiltre,
  onEffacerTousFiltres,
  totalProduits,
  isScrolling,
  pathname,
  hideMarqueFilter = false
}) => {
  const [openDropdown, setOpenDropdown] = useState(null)
  const [priceRange, setPriceRange] = useState([10, 300])
  const [isLoadingTailles, setIsLoadingTailles] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [dropdownData, setDropdownData] = useState({
    Prix: { min: 10, max: 300 },
    Genres: [],
    Catégories: [],
    Tailles: [],
    Marques: []
  })
  const [selectedGenreId, setSelectedGenreId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [genresRes, categoriesRes, marquesRes] = await Promise.all([
          fetch("http://localhost:5000/genres").then((res) => res.json()),
          fetch("http://localhost:5000/categories").then((res) => res.json()),
          fetch("http://localhost:5000/marques").then((res) => res.json())
        ])

        const genres = Array.isArray(genresRes) ? genresRes : genresRes.data || []
        const categories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || []
        const marques = Array.isArray(marquesRes) ? marquesRes : marquesRes.data || []

        setDropdownData((prev) => ({
          ...prev,
          Genres: genres,
          Catégories: organizeCategories(categories),
          Marques: marques,
          Tailles: []
        }))
      } catch (error) {
        console.error("Error fetching dropdown data:", error)
      }
    }

    fetchDropdownData()
  }, [])

  useEffect(() => {
    const genreFilter = filtresSelectionnes.find((f) => f.category === "Genres")
    const categoryFilter = filtresSelectionnes.find((f) => f.category === "Catégories")

    if (genreFilter) {
      const genre = dropdownData.Genres.find((g) => g.libelle === genreFilter.filter)
      setSelectedGenreId(genre?.id || null)
    } else {
      setSelectedGenreId(null)
    }

    if (categoryFilter) {
      const category = findCategory(dropdownData.Catégories, categoryFilter.filter)
      setSelectedCategoryId(category?.id || null)
    } else {
      setSelectedCategoryId(null)
    }
  }, [filtresSelectionnes, dropdownData])

  const findCategory = (categories, name) => {
    for (const category of categories) {
      if (category.libelle === name) return category
      if (category.subcategories) {
        const found = findCategory(category.subcategories, name)
        if (found) return found
      }
    }
    return null
  }

  const fetchTailles = async () => {
    setIsLoadingTailles(true)
    try {
      if (!selectedGenreId || !selectedCategoryId) {
        setDropdownData((prev) => ({ ...prev, Tailles: [] }))
        return
      }

      const response = await fetch(
        `http://localhost:5000/tailles?genre_id=${selectedGenreId}&categorie_id=${selectedCategoryId}`
      )

      const data = await response.json()
      const tailles = Array.isArray(data) ? data : data.data || []

      setDropdownData((prev) => ({
        ...prev,
        Tailles: tailles
      }))
    } catch (error) {
      console.error("Error fetching sizes:", error)
      setDropdownData((prev) => ({ ...prev, Tailles: [] }))
    } finally {
      setIsLoadingTailles(false)
    }
  }

  const handlePriceApply = () => {
    onSelectionFiltre("Prix", {
      min: priceRange[0],
      max: priceRange[1]
    })
    setOpenDropdown(null)
  }

  const organizeCategories = (categories) => {
    const categoryMap = {}
    const rootCategories = []

    categories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        subcategories: []
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

  const toggleDropdown = (name) => {
    if (name === "Tailles") fetchTailles()
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const renderFilterContent = (title) => {
    const items = dropdownData[title]
    const safeItems = Array.isArray(items) ? items : []

    if (title === "Prix") {
      return (
        <div className="p-4 w-full max-w-xs">
          <div className="mb-4">
            <Slider value={priceRange} onValueChange={setPriceRange} min={10} max={300} step={5} className="my-6" />
            <div className="flex justify-between text-xs mt-2">
              <span>{priceRange[0]} DT</span>
              <span>{priceRange[1]} DT</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs mb-4">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              min={10}
              max={priceRange[1]}
              className="w-full text-xs"
              placeholder="Min"
            />
            <span>à</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              min={priceRange[0]}
              max={300}
              className="w-full text-xs"
              placeholder="Max"
            />
          </div>
          <Button onClick={handlePriceApply} className="w-full bg-black hover:bg-gray-800 text-white" size="sm">
            Appliquer
          </Button>
        </div>
      )
    }

    if (title === "Tailles") {
      return (
        <div className="p-2 max-h-60 overflow-y-auto">
          {isLoadingTailles ? (
            <div className="text-xs py-2 text-gray-500 px-2">Chargement...</div>
          ) : safeItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {safeItems.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => {
                    onSelectionFiltre(title, item.libelle)
                    setOpenDropdown(null)
                    setIsMobileFilterOpen(false)
                  }}
                >
                  {item.libelle}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs py-2 text-gray-500 px-2">
              {selectedGenreId && selectedCategoryId
                ? "Aucune taille disponible"
                : "Sélectionnez un genre et une catégorie"}
            </div>
          )}
        </div>
      )
    }

    const renderCategory = (category) => (
      <div key={category.id} className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-medium w-full justify-start hover:bg-gray-100"
          onClick={() => {
            onSelectionFiltre(title, category.libelle)
            setOpenDropdown(null)
            setIsMobileFilterOpen(false)
          }}
        >
          {category.libelle}
        </Button>
        {(category.subcategories || []).length > 0 && (
          <div className="ml-4 mt-1 space-y-1">
            {category.subcategories.map((subcategory) => (
              <Button
                key={subcategory.id}
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-start hover:bg-gray-100"
                onClick={() => {
                  onSelectionFiltre(title, subcategory.libelle)
                  setOpenDropdown(null)
                  setIsMobileFilterOpen(false)
                }}
              >
                {subcategory.libelle}
              </Button>
            ))}
          </div>
        )}
      </div>
    )

    return <div className="p-2 max-h-60 overflow-y-auto">{safeItems.map(renderCategory)}</div>
  }

  const renderDesktopFilters = () => (
    <div
      className={`hidden md:flex w-full justify-between items-center border-b border-gray-200 pb-4 transition-all duration-300 ${
        pathname.startsWith("/store") && isScrolling
          ? "sticky top-0 py-3 px-5 backdrop-blur-sm shadow-sm z-40"
          : ""
      }`}
    >
      <div className="flex space-x-6 items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-medium hover:bg-transparent hover:underline"
          onClick={onEffacerTousFiltres}
        >
          Tous
        </Button>

        {Object.keys(dropdownData).map((key) => {
          if (hideMarqueFilter && key === "Marques") return null
          return (
            <Popover
              key={key}
              open={openDropdown === key}
              onOpenChange={(open) => (open ? toggleDropdown(key) : setOpenDropdown(null))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-medium hover:bg-transparent hover:underline flex items-center gap-1"
                >
                  {key}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2">
                  <div className="font-medium text-sm mb-2">{key}</div>
                  {renderFilterContent(key)}
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      <div className="text-xs font-medium">
        {totalProduits} Produit{totalProduits !== 1 ? "s" : ""}
      </div>
    </div>
  )

  const renderMobileFilters = () => (
    <div className="md:hidden w-full">
      <div
        className={`flex justify-between items-center border-b border-gray-200 pb-4 transition-all duration-300 ${
          pathname.startsWith("/store") && isScrolling
            ? "sticky top-0 py-3 px-4 bg-white/95 backdrop-blur-sm shadow-sm z-40"
            : ""
        }`}
      >
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filtres
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-[350px] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium hover:bg-transparent hover:underline"
                onClick={() => {
                  onEffacerTousFiltres()
                  setIsMobileFilterOpen(false)
                }}
              >
                Voir tous les produits
              </Button>

              {Object.keys(dropdownData).map((key) => {
                if (hideMarqueFilter && key === "Marques") return null
                return (
                  <div key={key} className="border-t pt-4">
                    <h3 className="font-medium text-sm mb-3">{key}</h3>
                    {renderFilterContent(key)}
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>

        <div className="text-xs font-medium">
          {totalProduits} Produit{totalProduits !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  )

  return (
    <div className="font-mono mb-8">
      {renderDesktopFilters()}
      {renderMobileFilters()}

      {filtresSelectionnes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filtresSelectionnes.map((item, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1 px-3 py-1 rounded-full text-xs">
              <span>{typeof item.filter === "object" ? `${item.filter.min}-${item.filter.max} DT` : item.filter}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSuppressionFiltre(item.filter)} />
            </Badge>
          ))}

          {filtresSelectionnes.length > 1 && (
            <Button variant="outline" size="sm" className="text-xs rounded-full" onClick={onEffacerTousFiltres}>
              Supprimer tout
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBarMarque