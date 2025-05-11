"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const SearchComponent = ({ isSearchVisible, setIsSearchVisible }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setIsSearchVisible(false);
    }
  };

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/articles/search?query=${encodeURIComponent(query)}`
      );
      setSearchResults(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("No results found.");
        setSearchResults([]); // Clear results or show a "No results" message
      } else {
        console.error("Failed to fetch search results:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetchSearchResults = debounce(fetchSearchResults, 300);

  return (
    isSearchVisible && (
      <div className="fixed top-0 left-0 w-full z-50 p-9 flex flex-col justify-center items-center">
        <div className="w-1/2 relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debouncedFetchSearchResults(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none text-sm focus:border-black"
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="absolute  top-4 mt-0.5 transform -translate-y-1/2 ml-2 py-1.5 px-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <SearchIcon className="w-5" />
          </button>
          <button
            onClick={() => setIsSearchVisible(false)}
            className="absolute -right-20 top-1/2 transform -translate-y-1/2 ml-2 p-2 text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>
            
        {isLoading ? (
  <div className="w-1/2 p-2">Chargement...</div>
) : (
  searchResults.length > 0 ? (
    <div className="w-1/2 mt-2 bg-white border border-gray-300 rounded-md shadow-md">
      {searchResults.map((result, index) => (
        <div
          key={index}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            router.push(`/product/${result.id}`);
            setIsSearchVisible(false);
          }}
        >
          {result.name}
        </div>
      ))}
    </div>
  ) : (
    <div className="w-1/2 p-2">Aucun résultat trouvé.</div>
  )
)}
      </div>
    )
  );
};

export default SearchComponent;