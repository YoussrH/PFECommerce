"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SubmenuTendance({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  const [categories, setCategories] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);

/*   useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending categories
        const categoriesRes = await fetch('http://localhost:5000/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.filter(cat => cat.parent_id === 1).slice(0, 4));

        // Fetch a featured article
        const articlesRes = await fetch('http://localhost:5000/articles');
        const articlesData = await articlesRes.json();
        setFeaturedArticle(articlesData[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); */

  return (
    <div
      className={`absolute left-0 top-[165px] w-full bg-white border border-gray-200 shadow-md transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: isScrolled ? "51px" : "166px" }}
    >
      <div className="mx-auto w-[75%] py-8 px-6 hidden md:flex gap-12">
        {/* Categories Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider">Catégories</h4>
          <ul className="mt-3 space-y-2">
            {categories.map((category, index) => (
              <li key={index}>
                <Link 
                  href={`/categories/${category.id}`} 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-xs"
                >
                  {category.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Selection Images Section */}
        <div className="flex gap-6">
          <div className="relative group w-[320px]">
            {featuredArticle?.images?.[0] ? (
              <Image
                src={featuredArticle.images[0]}
                alt={featuredArticle.nom_produit || "Featured article"}
                width={320}
                height={400}
                className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg shadow-md"
              />
            ) : (
              <div className="h-80 w-[320px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                <span className="text-gray-500">Loading...</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-xs font-semibold mb-2">Sélection Tendance</h4>
              <Link 
                href="/tendance" 
                className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
              >
                Découvrir Plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}