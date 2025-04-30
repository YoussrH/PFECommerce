"use client";
import Breadcrumb from "@/app/components/Breadcrumb/Breadcrumb";
import FilterBar from "@/app/components/Product/Filterbar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProduitsListe from "./ProduitsListe";

const ProduitsPage = () => {
  const pathname = usePathname() || "";
  const [isScrolling, setIsScrolling] = useState(false);
  const [filtresSelectionnes, setFiltresSelectionnes] = useState([]);
  const [produitsFiltres, setProduitsFiltres] = useState([]);
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const chargerProduits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:5000/articles/ObtenirTousArticleAleatoire");
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const produits = Array.isArray(data.donnees) ? data.donnees : [];
        
        setProduits(produits);
        setProduitsFiltres(produits);
      } catch (erreur) {
        console.error("Error loading products:", erreur);
        toast.error("Error loading products");
      } finally {
        setIsLoading(false);
      }
    };

    chargerProduits();
  }, []);

  const handleSelectionFiltre = (category, filter) => {
    setFiltresSelectionnes((prev) => {
      const nouveauxFiltres = [...prev, { category, filter }];
      appliquerFiltres(nouveauxFiltres);
      return nouveauxFiltres;
    });
  };

  const handleSuppressionFiltre = (filterASupprimer) => {
    setFiltresSelectionnes((prev) => {
      const nouveauxFiltres = prev.filter((f) => 
        typeof f.filter === "object" 
          ? f.filter.min !== filterASupprimer.min || f.filter.max !== filterASupprimer.max
          : f.filter !== filterASupprimer
      );
      appliquerFiltres(nouveauxFiltres);
      return nouveauxFiltres;
    });
  };

  const handleEffacerTousFiltres = () => {
    setFiltresSelectionnes([]);
    setProduitsFiltres(produits);
  };

  const appliquerFiltres = async (filtres) => {
    try {
      setIsLoading(true);
      
      if (filtres.length === 0) {
        setProduitsFiltres(produits);
        return;
      }
  
      const response = await fetch("http://localhost:5000/articles/filtrerArticles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filtres }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Filter request failed");
      }
      
      const data = await response.json();
      const donneesFiltrees = Array.isArray(data.data) ? data.data : [];
      setProduitsFiltres(donneesFiltrees);
    } catch (erreur) {
      console.error("Filter error:", erreur);
      toast.error("Error filtering products");
      setProduitsFiltres(produits);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen pb-20">
      <Breadcrumb />
      <div className="px-4 sm:px-6 lg:px-10 py-6 font-serif flex flex-col items-center">
      <h1 className="text-sm sm:text-base font-semibold text-center mb-2 uppercase">
        Nos Produits du Moment
      </h1>

      <p className="font-mono text-xs sm:text-sm text-center max-w-2xl mx-auto mb-6">
        Explorez une sélection unique de produits choisis pour vous – tendances, nouveautés et coups de cœur à découvrir !
      </p>


        <FilterBar
          filtresSelectionnes={filtresSelectionnes}
          onSelectionFiltre={handleSelectionFiltre}
          onSuppressionFiltre={handleSuppressionFiltre}
          onEffacerTousFiltres={handleEffacerTousFiltres}
          totalProduits={produitsFiltres.length}
        />

        {isLoading ? (
          <div className="w-full flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <ProduitsListe produits={produitsFiltres} />
        )}
      </div>
    </section>
  );
};

export default ProduitsPage;