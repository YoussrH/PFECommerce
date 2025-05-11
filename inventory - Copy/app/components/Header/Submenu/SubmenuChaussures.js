"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function SubmenuChaussures({ isOpen, onMouseEnter, onMouseLeave, isScrolled }) {
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [femmeArticle, setFemmeArticle] = useState(null);
  const [hommeArticle, setHommeArticle] = useState(null);
  const [loading, setLoading] = useState({
    categories: true,
    marques: true,
    femmeArticle: true,
    hommeArticle: true
  });
  const [error, setError] = useState(null);

/*   useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/categories');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch marques
        const marquesResponse = await fetch('http://localhost:5000/marques');
        if (!marquesResponse.ok) throw new Error('Failed to fetch marques');
        const marquesData = await marquesResponse.json();
        setMarques(marquesData);

        // Fetch femme article
        const femmeResponse = await fetch('http://localhost:5000/articles/genre/3'); // Assuming 3 is Femme
        if (!femmeResponse.ok) throw new Error('Failed to fetch Femme articles');
        const femmeData = await femmeResponse.json();
        if (femmeData.length > 0) setFemmeArticle(femmeData[0]);

        // Fetch homme article
        const hommeResponse = await fetch('http://localhost:5000/articles/genre/2'); // Assuming 2 is Homme
        if (!hommeResponse.ok) throw new Error('Failed to fetch Homme articles');
        const hommeData = await hommeResponse.json();
        if (hommeData.length > 0) setHommeArticle(hommeData[0]);

        setLoading({
          categories: false,
          marques: false,
          femmeArticle: false,
          hommeArticle: false
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast.error(`Erreur de chargement: ${error.message}`, {
          position: 'top-center',
          duration: 5000
        });
      }
    };

    fetchData();
  }, []); */

  const getSubCategories = (parentId) => {
    return categories.filter(category => category.parent_id === parentId);
  };

  return (
    <div
      className={`absolute left-0 top-[165px] w-full bg-white border border-gray-200 shadow-md transition-all duration-300 ease-in-out z-50 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: isScrolled ? "51px" : "166px" }}
    >
      <div className="mx-auto w-[85%] p-6 flex gap-12">
        {/* Categories Section */}
        <div>
          <h4 className="font-bold font-serif mb-2 uppercase text-sm">Categories</h4>
          {loading.categories ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {getSubCategories(1).map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/categories/${category.id}`} 
                    className="hover:text-blue-600 font-light font-serif text-sm"
                  >
                    {category.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Marques Section */}
        <div>
          <h4 className="font-bold font-serif mb-2 uppercase text-sm">Marque</h4>
          {loading.marques ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {marques.map((marque) => (
                <li key={marque.id}>
                  <Link 
                    href={`/marques/${marque.id}`} 
                    className="hover:text-blue-600 font-light font-serif text-sm"
                  >
                    {marque.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Featured Articles Section */}
        <div className="flex gap-8">
          {/* Femme Article */}
          <div className="relative group">
            {loading.femmeArticle ? (
              <div className="h-96 w-[350px] bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">Chargement...</span>
              </div>
            ) : femmeArticle?.images?.[0] ? (
              <Image
                src={femmeArticle.images[0]}
                alt={`Sélection Femme - ${femmeArticle.nom_produit || ''}`}
                width={350}
                height={50}
                className="h-96 rounded-lg shadow-md object-cover group-hover:scale-105 transition-transform duration-300"
                priority
              />
            ) : (
              <div className="h-96 w-[350px] bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">Aucune image disponible</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-xs font-semibold mb-2">Sélection Femme</h4>
              <Link 
                href="/genre/3" // Assuming 3 is Femme
                className="px-4 py-2 text-black font-medium bg-white rounded-full shadow hover:bg-gray-300 transition"
              >
                Découvrir Plus
              </Link>
            </div>
          </div>

          {/* Homme Article */}
          <div className="relative group">
            {loading.hommeArticle ? (
              <div className="h-96 w-[350px] bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">Chargement...</span>
              </div>
            ) : hommeArticle?.images?.[0] ? (
              <Image
                src={hommeArticle.images[0]}
                alt={`Sélection Homme - ${hommeArticle.nom_produit || ''}`}
                width={350}
                height={50}
                className="h-96 rounded-lg shadow-md object-cover group-hover:scale-105 transition-transform duration-300"
                priority
              />
            ) : (
              <div className="h-96 w-[350px] bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-gray-500">Aucune image disponible</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-xs font-semibold mb-2">Sélection Homme</h4>
              <Link 
                href="/genre/2" // Assuming 2 is Homme
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
