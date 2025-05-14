"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb";
import FilterParMarque from "@/app/components/Product/FilterParMarque";
import ProductListMarque from "../ProductListMarque";
import useMarques from "@/hooks/useMarques";
import { Skeleton } from "@/components/ui/skeleton";
import BreadcrumbMarque from "@/app/components/Breadcrumb/BreadcrumbMarque ";

export default function BrandPage({  }) {
  const params = useParams(); // Proper way to access params in client components
  const { brand } = params;
  const router = useRouter();
  const [filters, setFilters] = useState([]);
  const [isScrolling, setIsScrolling] = useState(false);

const { articlesByMarque, fetchArticlesByMarque } = useMarques();

  useEffect(() => {
    const handleScroll = () => setIsScrolling(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (brand) {
      fetchArticlesByMarque(brand);
    }
  }, [brand, fetchArticlesByMarque]);

  const handleFilterSelect = (category, filter) => {
    setFilters((prev) => [...prev, { category, filter }]);
  };

  const handleFilterRemove = (filterToRemove) => {
    setFilters((prev) =>
      prev.filter((f) =>
        typeof f.filter === "object"
          ? f.filter.min !== filterToRemove.min || f.filter.max !== filterToRemove.max
          : f.filter !== filterToRemove
      )
    );
  };

  const handleClearAllFilters = () => setFilters([]);

  const getFilteredProducts = () => {
    if (!articlesByMarque?.data?.articles) return [];
    
    return articlesByMarque.data.articles.filter((article) =>
      filters.every((filter) => {
        switch (filter.category) {
          case "Prix":
            return article.prix_final >= filter.filter.min && article.prix_final <= filter.filter.max;
          case "Genres":
            return article.genre?.libelle === filter.filter;
          case "Catégories":
            return article.categorie?.libelle === filter.filter;
          default:
            return true;
        }
      })
    );
  };

  if (!brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Erreur</h2>
        <p className="text-gray-600 mb-6">Aucun identifiant de marque fourni.</p>
        <button
          onClick={() => router.push("/store/marques")}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Retour aux marques
        </button>
      </div>
    );
  }

  if (articlesByMarque.loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Skeleton className="h-10 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="mt-16">
          <div className="flex gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-md" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (articlesByMarque.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
        <p className="text-gray-600 mb-6">{articlesByMarque.error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => fetchArticlesByMarque(brand)}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Réessayer
          </button>
          <button
            onClick={() => router.push("/store/marques")}
            className="px-6 py-2 border border-black rounded hover:bg-gray-100 transition"
          >
            Retour aux marques
          </button>
        </div>
      </div>
    );
  }

  if (!articlesByMarque?.data?.marque || !articlesByMarque?.data?.articles) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Marque non trouvée</h2>
        <p className="text-gray-600 mb-6">La marque que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.</p>
        <button
          onClick={() => router.push("/store/marques")}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Retour aux marques
        </button>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <>
    <BreadcrumbMarque brandName={articlesByMarque.data.marque.libelle} />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold mb-8">LA MARQUE {articlesByMarque.data.marque.libelle}</h1>
            <p className="max-w-3xl mx-auto text-gray-700">Découvrez le confort emblématique de notre partenaire ’{articlesByMarque.data.marque.libelle}’,plongez dans des univers créatifs et décalés qui éveillent l’imaginaire.</p>
          
        </div>
        <div className="mt-16">
          <FilterParMarque
            filtresSelectionnes={filters}
            onSelectionFiltre={handleFilterSelect}
            onSuppressionFiltre={handleFilterRemove}
            onEffacerTousFiltres={handleClearAllFilters}
            totalProduits={filteredProducts.length}
            isScrolling={isScrolling}
            pathname={`/store/marques/${brand}`}
            hideMarqueFilter={true}
          />
          <ProductListMarque produits={filteredProducts} onEffacerTousFiltres={handleClearAllFilters} />
        </div>
      </div>
    </>
  );
}