"use client";
import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchComponent({
  isSearchVisible,
  setIsSearchVisible,
  onSearch,
  searchQuery,
  setSearchQuery,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchVisible]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    } else if (e.key === "Escape") {
      setIsSearchVisible(false);
    }
  };

  if (!isSearchVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex-grow">Rechercher</h2>
          <button 
            onClick={() => setIsSearchVisible(false)} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center border-b border-gray-300 pb-2">
            <Search size={20} className="text-gray-500 mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des produits..."
              className="w-full outline-none text-base"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onSearch}
              disabled={!searchQuery.trim()}
              className={`px-4 py-2 rounded-md text-sm ${
                searchQuery.trim()
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}