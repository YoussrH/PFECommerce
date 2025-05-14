"use client"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { ShoppingBag, X, Loader2, Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/contexts/AuthContext"

export default function PanierDropdown({ isAuthenticated, userPrenom, isOpen, onMouseEnter, onMouseLeave, onClick }) {
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef(null)
  const [dropdownOuvert, setDropdownOuvert] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(null)
  const [animateItems, setAnimateItems] = useState(false)
  const { user } = useAuth()

  const { panier, chargement, erreur, supprimerArticle, recupererPanier, getTotal } = usePanier()

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
    const fetchCart = async () => {
      if (isOpen) {
        try {
          await recupererPanier()
          // Delay animation start for a smoother appearance
          setTimeout(() => setAnimateItems(true), 100)
        } catch (error) {
          console.error("Error fetching cart:", error)
        }
      } else {
        setAnimateItems(false)
      }
    }

    fetchCart()
  }, [isOpen, recupererPanier])

  const handleSupprimerArticle = async (idArticlePanier, event) => {
    if (event) event.stopPropagation()
    setSuppressionEnCours(idArticlePanier)
    try {
      await supprimerArticle(idArticlePanier)
      toast.success("Article supprimé du panier")
    } catch (erreur) {
      toast.error("Échec de la suppression")
    } finally {
      setSuppressionEnCours(null)
    }
  }

  const getImageUrl = (article) => {
    if (!article?.article?.images_couleurs?.[0]?.image_url) return null
    const url = article.article.images_couleurs[0].image_url
    return url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${url}`
  }

  const calculerSousTotal = () => {
    return panier
      .reduce((total, article) => {
        return total + article.prix_au_moment_ajout * article.quantite
      }, 0)
      .toFixed(2)
  }

  const nombreArticles = panier.reduce((count, article) => count + article.quantite, 0) || 0

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => {
        setDropdownOuvert(true)
        onMouseEnter?.("panier")
      }}
      onMouseLeave={() => {
        setDropdownOuvert(false)
        onMouseLeave?.()
      }}
    >
      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors relative ${
          pathname === "/caisse/panier" ? "bg-gray-100" : ""
        }`}
        onClick={onClick}
        aria-label="Panier"
      >
        <ShoppingBag className="w-5 h-5 text-gray-700" />
        {nombreArticles > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-black text-white text-[10px] font-medium rounded-full">
            {nombreArticles}
          </span>
        )}
      </button>

      {dropdownOuvert && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          onMouseEnter={() => setDropdownOuvert(true)}
          onMouseLeave={() => setDropdownOuvert(false)}
        >
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-gray-700" />
                <h3 className="text-sm font-medium">Mon panier</h3>
              </div>
              {nombreArticles > 0 && (
                <span className="text-xs text-gray-500">
                  {nombreArticles} article{nombreArticles !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {chargement && !suppressionEnCours ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Chargement du panier...</p>
              </div>
            ) : erreur ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-500 mb-3">Erreur de chargement</p>
                <button onClick={recupererPanier} className="text-sm text-black underline hover:text-gray-700">
                  Réessayer
                </button>
              </div>
            ) : panier.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Votre panier est vide</p>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                >
                  Explorer les produits
                </Link>
              </div>
            ) : (
              <div>
                <ul className="divide-y divide-gray-100">
                  {panier.map((article, index) => {
                    const imageUrl = getImageUrl(article)
                    return (
                      <li
                        key={`${article.id}-${article.taille?.id}`}
                        className={`group transition-all duration-300 ${
                          animateItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={article.article?.nom_produit || "Produit"}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized={true}
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=60&width=60"
                                    e.currentTarget.onerror = null
                                  }}
                                />
                              ) : (
                                <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  Image
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium truncate">
                                  {article.article?.nom_produit || "Produit"}
                                </p>
                                <p className="text-sm font-medium ml-2">{article.prix_au_moment_ajout} DT</p>
                              </div>

                              <p className="text-xs text-gray-500 mt-0.5">
                                {article.article?.marque?.libelle || "Marque"}
                              </p>

                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-xs text-gray-600">
                                  {article.taille?.libelle && `Taille: ${article.taille.libelle}`}
                                  {article.couleur?.libelle && ` • ${article.couleur.libelle}`}
                                </div>

                                <div className="flex items-center">
                                  <div className="flex items-center border border-gray-200 rounded-md mr-2">
                                    <button className="px-2 py-1 text-gray-500 hover:text-black">
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-medium px-2">{article.quantite}</span>
                                    <button className="px-2 py-1 text-gray-500 hover:text-black">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={(e) => handleSupprimerArticle(article.id, e)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    aria-label="Supprimer"
                                    disabled={suppressionEnCours === article.id}
                                  >
                                    {suppressionEnCours === article.id ? (
                                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                                    ) : (
                                      <X className="text-red-500 h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-medium">Sous-total:</span>
                    <span className="font-semibold">{calculerSousTotal()} DT</span>
                  </div>

                  <Link
                    href="/caisse/panier"
                    className="block w-full text-center px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-white hover:text-black border border-black transition-colors"
                    onClick={() => setDropdownOuvert(false)}
                  >
                    Voir le panier
                  </Link>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
