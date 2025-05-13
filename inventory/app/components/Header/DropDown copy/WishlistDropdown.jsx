"use client"
import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useWishlist } from "@/hooks/useWishlist"
import { toast } from "sonner"
import { Heart, ShoppingBag, ChevronRight, X, Loader2 } from "lucide-react"

export default function WishlistDropdown({ isAuthenticated, userPrenom, isOpen, onMouseEnter, onMouseLeave, onClick }) {
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [animateItems, setAnimateItems] = useState(false)

  const { listeEnvies, obtenirListeEnvies, estDansListeEnvies } = useWishlist()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onMouseLeave()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onMouseLeave])

  useEffect(() => {
    const fetchWishlist = async () => {
      if (isOpen && isAuthenticated) {
        setLoading(true)
        try {
          await obtenirListeEnvies()
          // Delay animation start for a smoother appearance
          setTimeout(() => setAnimateItems(true), 100)
        } catch (error) {
          toast.error("Erreur lors du chargement de la liste d'envies")
          console.error("Error fetching wishlist:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setAnimateItems(false)
      }
    }

    fetchWishlist()
  }, [isOpen, isAuthenticated, obtenirListeEnvies])

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      router.push("/client/listenvie")
    } else {
      onClick()
    }
  }

  // Safe image source getter with multiple fallbacks
  const getImageSource = (item) => {
    try {
      // Check primary image locations with proper null checks
      const article = item?.article || {}

      // Check images array first
      if (Array.isArray(article.images) && article.images.length > 0) {
        return article.images[0]
      }

      // Check images_couleurs array
      if (Array.isArray(article.images_couleurs) && article.images_couleurs.length > 0) {
        return article.images_couleurs[0]?.image_url
      }

      // Check direct image properties
      if (article.image_url) return article.image_url
      if (article.featured_image) return article.featured_image
      if (article.primaryImage) return article.primaryImage
    } catch (error) {
      console.error("Error getting image source:", error)
    }
    return "/placeholder.svg?height=60&width=60"
  }

  const removeFromWishlist = (itemId, event) => {
    event.stopPropagation()
    // Implement remove functionality here
    toast.success("Article retiré de votre liste d'envies")
  }

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-expanded={isOpen}
    >
      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors relative ${
          pathname === "/client/listenvie" ? "bg-gray-100" : ""
        }`}
        onClick={handleWishlistClick}
        aria-label="Liste d'envies"
      >
        <Heart className={`w-5 h-5 text-gray-700 ${pathname === "/client/listenvie" ? "fill-gray-700" : ""}`} />
        {listeEnvies?.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-black text-white text-[10px] font-medium rounded-full">
            {listeEnvies.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          onMouseLeave={onMouseLeave}
        >
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-gray-700" />
                <h3 className="text-sm font-medium">Ma liste d&apos;envies</h3>
              </div>
              {isAuthenticated && listeEnvies?.length > 0 && (
                <span className="text-xs text-gray-500">
                  {listeEnvies.length} article{listeEnvies.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {isAuthenticated ? (
            <>
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Chargement de votre liste...</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {listeEnvies?.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {listeEnvies.map((item, index) => {
                        const article = item?.article || {}
                        const imageSrc = getImageSource(item)
                        const productName = article.nom_produit || "Produit sans nom"
                        const price = article.prix_final || article.prix || "0"

                        return (
                          <li
                            key={item.id}
                            className={`group hover:bg-gray-50 transition-all duration-300 ${
                              animateItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            }`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                            onClick={() => router.push(`/product/${article.id || item.id}`)}
                          >
                            <div className="flex items-center p-3 cursor-pointer">
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                                <Image
                                  src={imageSrc || "/placeholder.svg"}
                                  alt={productName}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=60&width=60"
                                    e.currentTarget.onerror = null // Prevent infinite loop
                                  }}
                                />
                              </div>
                              <div className="ml-4 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-black">
                                  {productName}
                                </p>
                                <p className="mt-1 text-sm font-semibold">{price} DT</p>
                              </div>
                              <button
                                onClick={(e) => removeFromWishlist(item.id, e)}
                                className="p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600 transition-all duration-200"
                                aria-label="Retirer de la liste d'envies"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                        <Heart className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Votre liste d&apos;envies est vide</p>
                      <Link
                        href="/products"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Explorer les produits
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {listeEnvies?.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/client/listenvie"
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    <span>Voir toute ma liste d&apos;envies</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Heart className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium mb-2">Connectez-vous pour voir votre liste</h3>
              <p className="text-xs text-gray-500 mb-4">
                Connectez-vous pour créer ou accéder à votre liste d&apos;envies
              </p>
              <button
                onClick={onClick}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
