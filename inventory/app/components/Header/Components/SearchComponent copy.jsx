"use client"
import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SearchComponent({
  isSearchVisible,
  setIsSearchVisible,
  onSearch,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState([])
  const searchInputRef = useRef(null)
  const router = useRouter()

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    }
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchVisible])

  // Handle search submission
  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      // Save to recent searches
      const newRecentSearches = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))

      // Navigate to search results
      router.push(`/search?query=${encodeURIComponent(query)}`)
      setIsSearchVisible(false)
      setSearchQuery("")
    }
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setIsSearchVisible(false)
    }
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  if (!isSearchVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsSearchVisible(false)} />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* Search Header */}
          <div className="flex items-center p-4 border-b">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 outline-none text-lg"
            />
            <button
              onClick={() => setIsSearchVisible(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Search Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {searchQuery.trim() ? (
              // Search suggestions or results preview
              <div>
                <button
                  onClick={() => handleSearch()}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-md flex items-center"
                >
                  <Search className="h-4 w-4 text-gray-400 mr-3" />
                  <span>Rechercher "{searchQuery}"</span>
                </button>
              </div>
            ) : (
              // Recent searches
              <div>
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Recherches récentes</h3>
                      <button onClick={clearRecentSearches} className="text-xs text-gray-500 hover:text-gray-700">
                        Effacer tout
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(search)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-center text-sm"
                        >
                          <Search className="h-4 w-4 text-gray-400 mr-3" />
                          <span>{search}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Popular searches or categories */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recherches populaires</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Robes", "Chaussures", "Sacs", "Bijoux", "Parfums"].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
