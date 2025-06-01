"use client"
import { useEffect, useRef, useState } from "react"
import { Search, X, ArrowRight, Clock, Trash } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function SearchComponent({
  isSearchVisible,
  setIsSearchVisible,
  searchQuery,
  setSearchQuery,
}) {
  const inputRef = useRef(null)
  const [recentSearches, setRecentSearches] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isSearchVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSearchVisible])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchVisible) {
        setIsSearchVisible(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSearchVisible, setIsSearchVisible])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`http://localhost:5000/articles/rechercherArticles?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.donnees)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  if (!isSearchVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center p-4 border-b">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Rechercher des produits..."
            className="flex-1 outline-none text-base"
            autoComplete="off"
          />
          <button
            onClick={() => {
              setIsSearchVisible(false)
              setSearchQuery("")
              setSearchResults([])
            }}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Résultats de recherche</h3>
              <ul className="space-y-3">
                {searchResults.map((article) => {
                  // Get the primary image (first image from images_couleurs)
                  const primaryImage = article.primaryImage || '/placeholder-image.png'
                  return (
                    <li key={article.id}>
                      <Link
                        href={`/store/product/${article.id}`}
                        onClick={() => setIsSearchVisible(false)}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 relative mr-3 flex-shrink-0">
                          <Image
                            src={primaryImage}
                            alt={article.nom_produit}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{article.nom_produit}</p>
                          <p className="text-sm text-gray-600">
                            {article.prix_final.toFixed(2)} DT
                            {article.prix_initial && article.prix_final < article.prix_initial && (
                              <span className="ml-2 line-through text-gray-400">
                                {article.prix_initial.toFixed(2)} DT
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : recentSearches.length > 0 && !searchQuery ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Recherches récentes</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 flex items-center hover:text-gray-700"
                >
                  <Trash className="w-3 h-3 mr-1" />
                  Effacer
                </button>
              </div>
              <ul className="space-y-1">
                {recentSearches.map((search, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        setSearchQuery(search)
                      }}
                      className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 flex items-center text-sm"
                    >
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{search}</span>
                      <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : searchQuery.length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Aucun résultat trouvé pour "{searchQuery}"
            </div>
          ) : null}
        </div>


      </div>
    </div>
  )
}