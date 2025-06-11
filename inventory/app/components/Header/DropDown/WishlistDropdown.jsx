"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import "../top.css"; // Assuming this CSS file is relevant
import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { BadgeX } from "lucide-react"; // Import the X icon

const WishlistDropdown = ({
  isAuthenticated,
  userPrenom,
  // We will manage isOpen internally, so no need for it as a direct prop for hover control
  // However, we might keep it if a parent component needs to force close it for other reasons (e.g., global click outside)
  // For now, let's remove it as a direct hover control prop
  // isOpen, // No longer directly used for hover
  // onMouseEnter, // No longer directly used for hover
  // onMouseLeave, // No longer directly used for hover
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Internal state for dropdown visibility
  const [suppressionEnCours, setSuppressionEnCours] = useState(null); // State for item being removed
  const hoverTimeoutRef = useRef(null); // Ref for our hover timeout

  const {
    listeEnvies,
    chargement, // Use the chargement state from the hook
    obtenirListeEnvies,
    supprimerDeListeEnvies, // Import the delete function
  } = useWishlist();

  // --- Hover Logic ---
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsDropdownOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150); // Small delay to allow mouse to move between icon and dropdown content
  }, []);
  // --- End Hover Logic ---

  // Close dropdown on route change
  useEffect(() => {
    if (pathname) {
      setIsDropdownOpen(false); // Close dropdown when route changes
    }
  }, [pathname]);

  // Fetch wishlist when dropdown is opened (internally managed now)
  useEffect(() => {
    if (isDropdownOpen && isAuthenticated) {
      obtenirListeEnvies();
    }
  }, [isDropdownOpen, isAuthenticated, obtenirListeEnvies]);

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Prevent dropdown from closing if the icon is clicked
    if (isAuthenticated) {
      router.push("/client/listenvie");
      setIsDropdownOpen(false); // Close dropdown when navigating
    } else {
      toast.info("Connectez-vous pour voir ou gérer votre liste d'envies.");
      setIsDropdownOpen(true); // Keep dropdown open to show message or prompt login
    }
  };

  const handleSupprimerArticle = async (itemId) => {
    setSuppressionEnCours(itemId); // Set the item ID being removed
    try {
      const success = await supprimerDeListeEnvies(itemId);
      if (success) {
        toast.success("Article retiré de votre liste d'envies");
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      toast.error("Échec de la suppression de l'article.");
    } finally {
      setSuppressionEnCours(null); // Reset the state
    }
  };

  // Safe image source getter with multiple fallbacks
  const getImageSource = (item) => {
    try {
      const article = item?.article || {};

      if (Array.isArray(article.images) && article.images.length > 0) {
        return article.images[0];
      }

      if (Array.isArray(article.images_couleurs) && article.images_couleurs.length > 0) {
        return article.images_couleurs[0]?.image_url;
      }

      if (article.image_url) return article.image_url;
      if (article.featured_image) return article.featured_image;
      if (article.primaryImage) return article.primaryImage;
    } catch (error) {
      console.error("Error getting image source:", error);
    }
    return "/placeholder-product.png";
  };

  const nombreArticlesListeEnvies = listeEnvies.length || 0;

  return (
    <div
      className="relative p-1"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter} // Use internal hover handler
      onMouseLeave={handleMouseLeave} // Use internal hover handler
    >
      <div className="cursor-pointer relative" onClick={handleWishlistClick}>
        <Image
          src={pathname === "/client/listenvie" ? "/wishlistselected.svg" : "/wishlist.svg"}
          alt="Icône liste d'envies"
          width={30}
          height={30}
          priority
        />
        {nombreArticlesListeEnvies > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {nombreArticlesListeEnvies}
          </span>
        )}
      </div>

      {isDropdownOpen && ( // Use internal state here
        <div
          className="absolute right-0 mt-1 w-80 z-50 bg-white border border-gray-300 rounded-md shadow-md"
          // These are no longer needed here as the parent div handles the hover for the whole component
          // onMouseEnter={handleMouseEnter}
          // onMouseLeave={handleMouseLeave}
        >
          <div className="px-4 py-2 text-xs">
            <p className="font-semibold">Bonjour {userPrenom || "invité"}</p>
          </div>
          <hr className="border-t border-gray-300" />

          <div className="p-4 max-h-96 overflow-y-auto">
            {chargement && !suppressionEnCours ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mb-2"></div>
                <p className="text-xs">Chargement de la liste d'envies...</p>
              </div>
            ) : listeEnvies?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs mb-4">Votre liste de souhaits est vide.</p>
                <Link
                  href="/store/nouveautes"
                  className="inline-block px-3 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors"
                  onClick={() => setIsDropdownOpen(false)} // Close dropdown when clicking this link
                >
                  Explorer les produits
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {listeEnvies.map((item) => {
                    const article = item?.article || {};
                    const imageSrc = getImageSource(item);
                    const productName = article.nom_produit || "Produit sans nom";
                    const price = (article.prix_final || article.prix || 0).toFixed(2); // Ensure price is formatted

                    return (
                      <div key={item.id} className="border-b border-gray-200 last:border-0 pb-3">
                        <div className="flex items-center">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={imageSrc}
                              alt={productName}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                              unoptimized={true}
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-product.png";
                                e.currentTarget.onerror = null;
                              }}
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{productName}</p>
                            <p className="text-xs text-gray-500">{article.marque?.libelle || "Marque"}</p>
                          </div>
                          <p className="text-xs font-medium">{price} DT</p>
                        </div>

                        <div className="mt-2 pl-14">
                          <div className="flex justify-between items-center py-1">
                            <div>
                              <span className="text-xs text-gray-500">
                                {article.taille?.libelle && `Taille: ${article.taille.libelle}`}
                                {article.couleur?.libelle && ` - Couleur: ${article.couleur.libelle}`}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!suppressionEnCours) handleSupprimerArticle(item.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              aria-label="Supprimer"
                              disabled={suppressionEnCours === item.id}
                            >
                              {suppressionEnCours === item.id ? (
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
                  <Link
                    href="/client/listenvie"
                    className="block w-full text-center px-4 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors"
                    onClick={() => setIsDropdownOpen(false)} // Close dropdown when navigating to full wishlist page
                  >
                    Voir toute la liste
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

export default WishlistDropdown;