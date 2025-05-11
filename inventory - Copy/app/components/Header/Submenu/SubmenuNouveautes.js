"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SubmenuNouveautes({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  const [marques, setMarques] = useState([]);
  const [genres, setGenres] = useState([]);
  const [femmeArticle, setFemmeArticle] = useState(null);
  const [hommeArticle, setHommeArticle] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch genres
        const genresRes = await fetch('http://localhost:5000/genres');
        const genresData = await genresRes.json();
        setGenres(genresData);

        // Fetch brands
        const marquesRes = await fetch('http://localhost:5000/marques');
        const marquesData = await marquesRes.json();
        setMarques(marquesData);

        // Fetch femme article (assuming genre_id 4 is femme)
        const femmeRes = await fetch('http://localhost:5000/articles/obtenirArticlesParGenre/4');
        const femmeData = await femmeRes.json();
        if (femmeData.length > 0) {
          setFemmeArticle(femmeData[0]);
        }

        // Fetch homme article (assuming genre_id 5 is homme)
        const hommeRes = await fetch('http://localhost:5000/articles/obtenirArticlesParGenre/5');
        const hommeData = await hommeRes.json();
        if (hommeData.length > 0) {
          setHommeArticle(hommeData[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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
          <h4 className="font-semibold uppercase text-black text-xs tracking-wider">Catégories</h4>
          <ul className="mt-3 space-y-2">
            {genres.map((genre) => (
              <li key={genre.id}>
                <Link 
                  href={`/nouveautes/${genre.id}`}
                  className="text-black hover:text-blue-600 transition-colors text-xs"
                >
                  Nouveautés pour {genre.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Brands Section */}
        <div className="w-1/4">
          <h4 className="font-semibold uppercase text-black text-xs tracking-wider">Marques</h4>
          <ul className="mt-3 space-y-2">
            {marques.map((marque) => (
              <li key={marque.id}>
                <Link 
                  href={`/marques/${marque.id}`}
                  className="text-black hover:text-blue-600 transition-colors text-xs"
                >
                  {marque.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Images Section */}
        <div className="flex gap-6">
          {/* Femme Section */}
          <div className="relative group w-[320px]">
            {femmeArticle?.images?.[0] ? (
              <>
                <Image
                  src={femmeArticle.images[0]}
                  alt={femmeArticle.nom_produit || "Sélection Femme"}
                  width={320}
                  height={400}
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg shadow-md"
                  priority
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="text-xs font-semibold mb-2">Sélection Femme</h4>
                  <Link 
                    href="/nouveautes/femme"
                    className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
                  >
                    Découvrir Plus
                  </Link>
                </div>
              </>
            ) : (
              <div className="h-80 w-[320px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                <span className="text-gray-500">Aucun article disponible</span>
              </div>
            )}
          </div>

          {/* Homme Section */}
          <div className="relative group w-[320px]">
            {hommeArticle?.images?.[0] ? (
              <>
                <Image
                  src={hommeArticle.images[0]}
                  alt={hommeArticle.nom_produit || "Sélection Homme"}
                  width={320}
                  height={400}
                  className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg shadow-md"
                  priority
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="text-xs font-semibold mb-2">Sélection Homme</h4>
                  <Link 
                    href="/nouveautes/homme"
                    className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
                  >
                    Découvrir Plus
                  </Link>
                </div>
              </>
            ) : (
              <div className="h-80 w-[320px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                <span className="text-gray-500">Aucun article disponible</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}