"use client";
import { useState, useEffect, useRef } from "react";
import { Chip } from "@mui/material";
import { usePathname } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import ".././Header/top.css";

const FilterBar = ({
  filtresSelectionnes,
  onSelectionFiltre,
  onSuppressionFiltre,
  onEffacerTousFiltres,
  totalProduits,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [priceRange, setPriceRange] = useState([10, 300]);
  const pathname = usePathname() || "";
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoadingTailles, setIsLoadingTailles] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    Prix: { min: 10, max: 300 },
    Genres: [],
    Catégories: [],
    Tailles: [],
    Marques: [],
  });
  const dropdownRef = useRef(null);

  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const findCategory = (categories, name) => {
    for (const category of categories) {
      if (category.libelle === name) return category;
      if (category.subcategories) {
        const found = findCategory(category.subcategories, name);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 280);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [genresRes, categoriesRes, marquesRes] = await Promise.all([
          fetch("http://localhost:5000/genres").then((res) => res.json()),
          fetch("http://localhost:5000/categories").then((res) => res.json()),
          fetch("http://localhost:5000/marques").then((res) => res.json()),
        ]);

        const genres = Array.isArray(genresRes) ? genresRes : genresRes.data || [];
        const categories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || [];
        const marques = Array.isArray(marquesRes) ? marquesRes : marquesRes.data || [];

        setDropdownData((prev) => ({
          ...prev,
          Genres: genres,
          Catégories: organizeCategories(categories),
          Marques: marques,
          Tailles: [],
        }));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const genreFilter = filtresSelectionnes.find(f => f.category === "Genres");
    const categoryFilter = filtresSelectionnes.find(f => f.category === "Catégories");

    if (genreFilter) {
      const genre = dropdownData.Genres.find(g => g.libelle === genreFilter.filter);
      setSelectedGenreId(genre?.id || null);
    } else {
      setSelectedGenreId(null);
    }

    if (categoryFilter) {
      const category = findCategory(dropdownData.Catégories, categoryFilter.filter);
      setSelectedCategoryId(category?.id || null);
    } else {
      setSelectedCategoryId(null);
    }
  }, [filtresSelectionnes, dropdownData]);

  const fetchTailles = async () => {
    setIsLoadingTailles(true);
    try {
      if (!selectedGenreId || !selectedCategoryId) {
        setDropdownData(prev => ({ ...prev, Tailles: [] }));
        return;
      }

      const response = await fetch(
        `http://localhost:5000/tailles?genre_id=${selectedGenreId}&categorie_id=${selectedCategoryId}`
      );
      
      const data = await response.json();
      const tailles = Array.isArray(data) ? data : data.data || [];
      
      setDropdownData(prev => ({
        ...prev,
        Tailles: tailles,
      }));
    } catch (error) {
      console.error("Error fetching sizes:", error);
      setDropdownData(prev => ({ ...prev, Tailles: [] }));
    } finally {
      setIsLoadingTailles(false);
    }
  };

  const handlePriceApply = () => {
    onSelectionFiltre("Prix", {
      min: priceRange[0],
      max: priceRange[1],
    });
    setOpenDropdown(null); // Close after applying
  };

  const organizeCategories = (categories) => {
    const categoryMap = {};
    const rootCategories = [];

    categories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        subcategories: [],
      };
    });

    categories.forEach((category) => {
      if (category.parent_id) {
        const parent = categoryMap[category.parent_id];
        if (parent) parent.subcategories.push(categoryMap[category.id]);
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    return rootCategories;
  };

  const toggleDropdown = (name) => {
    if (name === "Tailles") fetchTailles();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const renderDropdownList = (items, title) => {
    const safeItems = Array.isArray(items) ? items : [];

    if (title === "Prix") {
      return (
        <div className="absolute bg-white border border-gray-300 mt-1 p-4 rounded-md shadow-lg z-50 w-64">
          <span className="block font-semibold text-sm mb-3">{title}</span>
          <div className="mb-3">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={10}
              max={300}
              step={5}
            />
            <div className="flex justify-between text-xs mt-2">
              <span>{priceRange[0]} DT</span>
              <span>{priceRange[1]} DT</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs mb-3">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              min={10}
              max={priceRange[1]}
              className="w-full border text-xs px-2 py-1 rounded"
              placeholder="Min"
            />
            <span>à</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              min={priceRange[0]}
              max={300}
              className="w-full border text-xs px-2 py-1 rounded"
              placeholder="Max"
            />
          </div>
          <button
            onClick={handlePriceApply}
            className="mt-1 w-full bg-black text-white text-xs px-3 py-1 rounded-md hover:bg-gray-800 transition-colors"
          >
            Appliquer
          </button>
        </div>
      );
    }

    if (title === "Tailles") {
      return (
        <div className="absolute bg-white border border-gray-300 mt-1 p-2 rounded-md shadow-lg z-50 w-48 max-h-40 overflow-y-auto">
          <span className="block font-semibold text-sm mb-2">{title}</span>
          <ul>
            {isLoadingTailles ? (
              <li className="text-xs py-1 text-gray-500 px-2">Chargement...</li>
            ) : safeItems.length > 0 ? (
              safeItems.map((item) => (
                <li
                  key={item.id}
                  className="text-xs py-1 cursor-pointer hover:bg-gray-100 px-2"
                  onClick={() => {
                    onSelectionFiltre(title, item.libelle);
                    setOpenDropdown(null); // Close after selection
                  }}
                >
                  {item.libelle}
                </li>
              ))
            ) : (
              <li className="text-xs py-1 text-gray-500 px-2">
                {selectedGenreId && selectedCategoryId 
                  ? "Aucune taille disponible" 
                  : "Sélectionnez un genre et une catégorie"}
              </li>
            )}
          </ul>
        </div>
      );
    }

    const renderCategory = (category) => (
      <div key={category.id}>
        <div
          className="text-xs py-1 cursor-pointer hover:bg-gray-100 px-2 font-bold"
          onClick={() => {
            onSelectionFiltre(title, category.libelle);
            setOpenDropdown(null); // Close after selection
          }}
        >
          {category.libelle}
        </div>
        {(category.subcategories || []).map((subcategory) => (
          <div
            key={subcategory.id}
            className="text-xs py-1 cursor-pointer hover:bg-gray-100 px-2 pl-4"
            onClick={() => {
              onSelectionFiltre(title, subcategory.libelle);
              setOpenDropdown(null); // Close after selection
            }}
          >
            {subcategory.libelle}
          </div>
        ))}
      </div>
    );

    return (
      <div className="absolute bg-white border border-gray-300 mt-1 p-2 rounded-md shadow-lg z-50 w-48 max-h-40 overflow-y-auto">
        <span className="block font-semibold text-sm mb-2">{title}</span>
        <ul>{safeItems.map((item) => renderCategory(item))}</ul>
      </div>
    );
  };

  return (
    <header className="font-mono" ref={dropdownRef}>
      <div className={`w-full max-w-7xl flex justify-between items-center border-b border-gray-300 pb-2 transition-all duration-300 ease-in-out ${
          pathname.startsWith("/store") && isScrolling
            ? "fixed left-32 top-0 py-3 px-5 w-full bg-white bg-[url('/background.svg')] bg-cover bg-center shadow-md z-50"
            : "mr-96"
        }`}>
        <div className={`flex space-x-6 text-xs gap-2 font-normal`}>
          <span onClick={onEffacerTousFiltres} className="cursor-pointer">
            Tous
          </span>
          {Object.keys(dropdownData).map((key) => (
            <div key={key} className="relative">
              <span
                className="cursor-pointer hover:uppercase hover:border-b-2 hover:border-black"
                onClick={() => toggleDropdown(key)}
              >
                {key}
              </span>
              {openDropdown === key && renderDropdownList(dropdownData[key], key)}
            </div>
          ))}
        </div>
        <span className="text-xs font-normal cursor-pointer hover:underline">
          {totalProduits} Produit(s)
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {filtresSelectionnes.map((item, index) => (
          <Chip
            key={index}
            label={
              <span className="text-xs">
                {typeof item.filter === "object"
                  ? `${item.filter.min}-${item.filter.max} DT`
                  : item.filter}
              </span>
            }
            variant="outlined"
            onDelete={() => onSuppressionFiltre(item.filter)}
            sx={{ fontSize: "0.75rem" }}
          />
        ))}
        {filtresSelectionnes.length > 1 && (
          <Chip
            label={<span className="text-xs">Supprimer Tout</span>}
            variant="outlined"
            onDelete={onEffacerTousFiltres}
            sx={{ fontSize: "0.75rem", fontWeight: "normal" }}
          />
        )}
      </div>
    </header>
  );
};

export default FilterBar;