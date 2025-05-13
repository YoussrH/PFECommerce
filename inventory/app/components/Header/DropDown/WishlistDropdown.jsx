"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import "../top.css";
import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

const WishlistDropdown = ({
  isAuthenticated,
  userPrenom,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  const { 
    listeEnvies, 
    obtenirListeEnvies,
    estDansListeEnvies 
  } = useWishlist();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onMouseLeave();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onMouseLeave]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (isOpen && isAuthenticated) {
        setLoading(true);
        try {
          await obtenirListeEnvies();
        } catch (error) {
          toast.error("Erreur lors du chargement de la liste d'envies");
          console.error("Error fetching wishlist:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWishlist();
  }, [isOpen, isAuthenticated, obtenirListeEnvies]);

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      router.push("/client/listenvie");
    } else {
      onClick();
    }
  };

  // Safe image source getter with multiple fallbacks
  const getImageSource = (item) => {
    try {
      // Check primary image locations with proper null checks
      const article = item?.article || {};
      
      // Check images array first
      if (Array.isArray(article.images) && article.images.length > 0) {
        return article.images[0];
      }
      
      // Check images_couleurs array
      if (Array.isArray(article.images_couleurs) && article.images_couleurs.length > 0) {
        return article.images_couleurs[0]?.image_url;
      }
      
      // Check direct image properties
      if (article.image_url) return article.image_url;
      if (article.featured_image) return article.featured_image;
      if (article.primaryImage) return article.primaryImage;
      
    } catch (error) {
      console.error("Error getting image source:", error);
    }
    return "/placeholder-product.png";
  };

  return (
    <div
      className="relative p-1"
      ref={dropdownRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cursor-pointer" onClick={handleWishlistClick}>
        <Image
          src={pathname === "/client/listenvie" ? "/wishlistselected.svg" : "/wishlist.svg"}
          alt="wishlist"
          width={30}
          height={30}
        />
      </div>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-64 z-50 bg-white border border-gray-300 rounded-md shadow-md"
          onMouseLeave={onMouseLeave}
        >
          <div className="px-4 py-2 text-xs">
            <p className="font-semibold">Bonjour {userPrenom}</p>
          </div>
          <hr className="border-t border-gray-300" />
          
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {listeEnvies?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {listeEnvies.map((item) => {
                    const article = item?.article || {};
                    const imageSrc = getImageSource(item);
                    const productName = article.nom_produit || "Produit sans nom";
                    const price = article.prix_final || article.prix || "0";
                    
                    return (
                      <li key={item.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 relative h-10 w-10">
                            <Image
                              src={imageSrc}
                              alt={productName}
                              fill
                              className="object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-product.png";
                                e.currentTarget.onerror = null; // Prevent infinite loop
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {price} DT
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs">
                  <p>Votre liste de souhaits est vide.</p>
                  <Link
                    href="/products"
                    className="mt-4 inline-block px-3 py-2 bg-black border border-black text-white rounded-sm hover:bg-white hover:text-black"
                  >
                    Explorer les produits
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistDropdown;