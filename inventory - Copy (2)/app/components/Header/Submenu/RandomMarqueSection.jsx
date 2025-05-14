"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RandomMarqueSection() {
  const [marque, setMarque] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/articles/marque/actuel");
        
        if (!response.ok) {
          // Handle 404 specifically
          if (response.status === 404) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Marque du jour non trouvée");
          }
          throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.marque) {
          throw new Error("Aucune donnée de marque reçue");
        }
        
        setMarque(data.marque);
        setArticles(data.articles || []);
        
        // Store in localStorage with today's date as key
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`marque_${today}`, JSON.stringify(data));
      } catch (error) {
        console.error("Erreur dans la recherche de marques et d'articles:", error);
        setError(error.message);
        
        // Try to load from cache if available
        const today = new Date().toISOString().split('T')[0];
        const cachedData = localStorage.getItem(`marque_${today}`);
        if (cachedData) {
          try {
            const data = JSON.parse(cachedData);
            if (data.marque) {
              setMarque(data.marque);
              setArticles(data.articles || []);
              setError(null);
            }
          } catch (parseError) {
            console.error("Erreur de parsing des données en cache:", parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Check if we have cached data for today
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem(`marque_${today}`);
    
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        if (data.marque) {
          setMarque(data.marque);
          setArticles(data.articles || []);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Erreur de parsing des données en cache:", error);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="text-center text-gray-600">Chargement de la sélection du jour...</div>
    </div>
  );
  
  if (error) return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="text-red-500 text-center">Erreur: {error}</div>
    </div>
  );
  
  if (!marque) return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="text-gray-500 text-center">Aucune marque sélectionnée aujourd&apos;hui</div>
    </div>
  );

  // Get the first article with images
  const featuredArticle = articles.find(article => article?.images?.length > 0) || articles[0];

  return (
    <div className="w-full bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-light text-gray-800">Découvrez notre sélection du jour</h2>
          <h3 className="text-3xl font-normal mt-2">{marque.name}</h3>
        </div>
        
        <div className="flex justify-center">
          <div className="relative group w-full max-w-2xl">
            {featuredArticle?.images?.[0] ? (
              <Image
                src={featuredArticle.images[0]}
                alt={`${marque.name} - ${featuredArticle.nom_produit || 'Produit'}`}
                width={800}
                height={450}
                className="w-full h-96 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <span className="text-gray-500">Image non disponible</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex flex-col justify-end p-6">
              <div className="text-white">
                <h3 className="text-xl font-medium">{featuredArticle?.nom_produit || marque.name}</h3>
                <p className="mt-2 line-clamp-2">{marque.description || "Découvrez notre sélection exclusive"}</p>
                
                <Link 
                  href={`/marques/${marque.id}`}
                  className="mt-4 inline-block px-6 py-2 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Voir la collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}