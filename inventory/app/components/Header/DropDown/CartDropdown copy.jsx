"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePanier } from "@/hooks/use-panier";
import { BadgeX } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/app/contexts/AuthContext';

const PanierDropdown = ({ 
  isAuthenticated, 
  userPrenom, 
  isOpen, 
  onMouseEnter, 
  onMouseLeave,
  onClick
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const { user } = useAuth();
  
  const {
    panier,
    chargement,
    erreur,
    supprimerArticle,
    recupererPanier,
    getTotal
  } = usePanier();

  useEffect(() => {
    console.log("CartDropdown mounted - fetching cart");
    recupererPanier();
  }, [recupererPanier]);

  useEffect(() => {
    if (pathname) {
      console.log("Route changed, closing dropdown");
      setDropdownOuvert(false);
    }
  }, [pathname]);

  const handleCartIconClick = (e) => {
    e.stopPropagation();
    console.log("Cart icon clicked");
    if (panier.length > 0) {
      console.log("Navigating to cart page");
      router.push("/caisse/panier");
    } else {
      console.log("Cart is empty, opening dropdown");
      setDropdownOuvert(!dropdownOuvert);
    }
  };

  const handleSupprimerArticle = async (idArticlePanier) => {
    console.log(`Removing item ${idArticlePanier}`);
    setSuppressionEnCours(idArticlePanier);
    try {
      await supprimerArticle(idArticlePanier);
      toast.success("Article supprimé du panier");
    } catch (erreur) {
      console.error("Error removing item:", erreur);
      toast.error("Échec de la suppression");
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const getImageUrl = (article) => {
    if (!article?.article?.images_couleurs?.[0]?.image_url) return null;
    const url = article.article.images_couleurs[0].image_url;
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
  };

  const calculerSousTotal = () => {
    return panier.reduce((total, article) => {
      return total + (article.prix_au_moment_ajout * article.quantite);
    }, 0).toFixed(2);
  };

  const nombreArticles = panier.reduce((count, article) => count + article.quantite, 0) || 0;

  return (
    <div
      className="relative p-1"
      ref={dropdownRef}
      onMouseEnter={() => {
        console.log("Mouse entered cart dropdown");
        setDropdownOuvert(true);
        onMouseEnter?.("panier");
      }}
      onMouseLeave={() => {
        console.log("Mouse left cart dropdown");
        setDropdownOuvert(false);
        onMouseLeave?.();
      }}
    >
      <div 
        className="cursor-pointer relative" 
        onClick={handleCartIconClick}
      >
        <Image
          src={pathname === "/caisse/panier" ? "/cart1.svg" : "/cartnotselected.svg"}
          alt="Icône panier"
          width={30}
          height={30}
          priority
        />
        {nombreArticles > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {nombreArticles}
          </span>
        )}
      </div>

      {dropdownOuvert && (
        <div
          className="absolute right-0 mt-1 w-80 z-50 bg-white border border-gray-300 rounded-md shadow-md"
          onMouseEnter={() => {
            console.log("Mouse entered dropdown content");
            setDropdownOuvert(true);
          }}
          onMouseLeave={() => {
            console.log("Mouse left dropdown content");
            setDropdownOuvert(false);
          }}
        >
          <div className="px-4 py-2 text-xs">
            <p className="font-semibold">
              Bonjour {user?.prenom || userPrenom || "invité"}
            </p>
            {erreur && <p className="text-red-500 text-xs mt-1">{erreur}</p>}
          </div>
          <hr className="border-t border-gray-300" />
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {chargement && !suppressionEnCours ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mb-2"></div>
                <p className="text-xs">Chargement du panier...</p>
              </div>
            ) : erreur ? (
              <div className="text-center py-4">
                <p className="text-red-500 text-xs mb-2">Erreur de chargement</p>
                <button
                  onClick={recupererPanier}
                  className="text-blue-500 underline text-xs hover:text-blue-600"
                >
                  Réessayer
                </button>
              </div>
            ) : panier.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs mb-4">Votre panier est vide.</p>
                <Link
                  href="/store/nouveautes"
                  className="inline-block px-3 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Voir les produits
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {panier.map((article) => {
                    const imageUrl = getImageUrl(article);
                    return (
                      <div key={`${article.id}-${article.taille?.id}`} className="border-b border-gray-200 last:border-0 pb-3">
                        <div className="flex items-center">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={article.article?.nom_produit || "Produit"}
                                fill
                                className="object-cover rounded"
                                sizes="48px"
                                unoptimized={true}
                              />
                            ) : (
                              <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Image
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{article.article?.nom_produit || "Produit"}</p>
                            <p className="text-xs text-gray-500">{article.article?.marque?.libelle || "Marque"}</p>
                          </div>
                          <p className="text-xs font-medium">{article.quantite} × {article.prix_au_moment_ajout} DT</p>
                        </div>
                        
                        <div className="mt-2 pl-14">
                          <div className="flex justify-between items-center py-1">
                            <div>
                              <span className="text-xs">
                                {article.taille?.libelle && `Taille: ${article.taille.libelle}`}
                                {article.couleur?.libelle && ` - Couleur: ${article.couleur.libelle}`}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(`Remove button clicked for item ${article.id}`);
                                if (!suppressionEnCours) handleSupprimerArticle(article.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              aria-label="Supprimer"
                              disabled={suppressionEnCours === article.id}
                            >
                              {suppressionEnCours === article.id ? (
                                <div className="h-4 w-4 border-t-2 border-b-2 border-red-500 rounded-full animate-spin" />
                              ) : (
                                <BadgeX className="text-red-500 h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-3">
                    <span>Sous-total:</span>
                    <span className="font-medium">{calculerSousTotal()} DT</span>
                  </div>
                  <Link
                    href="/caisse/panier"
                    className="block w-full text-center px-4 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("View cart button clicked");
                      setDropdownOuvert(false);
                    }}
                  >
                    Voir le panier
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PanierDropdown;