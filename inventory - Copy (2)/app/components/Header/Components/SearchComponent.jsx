"use client"
import { useEffect, useRef } from "react"
import { useState } from "react"

import { Search, X, ArrowRight, Clock, Trash } from "lucide-react"

export default function SearchComponent({
  isSearchVisible,
  setIsSearchVisible,
  onSearch,
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)

      setRecentSearches(newRecentSearches)
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))

      onSearch()
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  if (!isSearchVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden">
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
            onClick={() => setIsSearchVisible(false)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {recentSearches.length > 0 && (
            <div className="mb-4">
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
                        handleSearch()
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
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className={`px-4 py-2 rounded-md text-sm flex items-center ${
                searchQuery.trim()
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
