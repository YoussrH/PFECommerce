"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SubmenuMarque({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  const [marques, setMarques] = useState([]);
  const [featuredMarque, setFeaturedMarque] = useState(null);

 /*  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch marques
        const marquesRes = await fetch('http://localhost:5000/marques');
        const marquesData = await marquesRes.json();
        setMarques(marquesData.slice(0, 5));

        // Fetch featured marque
        const featuredRes = await fetch('http://localhost:5000/marque/actuel');
        const featuredData = await featuredRes.json();
        setFeaturedMarque(featuredData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); */

  return (
    <div
      className={`absolute left-0 w-full bg-white border border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      style={{ top: isScrolled ? "51px" : "166px" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mx-auto w-[75%] py-8 px-6 hidden md:flex gap-12">
        {/* Categories Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider">Catégories</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link 
                href="/marques"
                className="text-gray-600 hover:text-blue-600 transition-colors text-xs"
              >
                Toutes les marques
              </Link>
            </li>
          </ul>
        </div>

        {/* Brands Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-gray-700 text-xs tracking-wider">Marques</h4>
          <ul className="mt-3 space-y-2">
            {marques.map((marque, index) => (
              <li key={index}>
                <Link 
                  href={`/marques/${marque.id}`}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-xs"
                >
                  {marque.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Marque Section */}
        <div className="flex gap-6">
          {featuredMarque?.marque && (
            <div className="relative group w-[320px]">
              {featuredMarque.articles?.[0]?.images?.[0] ? (
                <Image
                  src={featuredMarque.articles[0].images[0]}
                  alt={`Marque ${featuredMarque.marque.libelle}`}
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
                <h4 className="text-xs font-semibold mb-2">Marque du jour: {featuredMarque.marque.libelle}</h4>
                <Link 
                  href={`/marques/${featuredMarque.marque.id}`}
                  className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
                >
                  Découvrir Plus
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}