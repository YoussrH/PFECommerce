"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { toast } from "sonner"
import ResumeCommande from "@/app/components/caisse/CartSummary"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/components/ui/button"

const Panier = () => {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const {
    panier,
    chargement,
    erreur,
    codePromo,
    setCodePromo,
    recupererPanier,
    mettreAJourQuantite,
    supprimerArticle,
    getTotal,
    initialiserCommande,
  } = usePanier()

  const [imageErrors, setImageErrors] = useState({})

  useEffect(() => {
    recupererPanier()
  }, [recupererPanier])

  const getImageUrl = (article) => {
    if (!article?.article?.images_couleurs?.[0]?.image_url) return null
    const url = article.article.images_couleurs[0].image_url
    return url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${url}`
  }

  const handleImageError = (articleId) => {
    setImageErrors((prev) => ({ ...prev, [articleId]: true }))
  }

  const handleCommanderClick = async () => {
    if (panier.length === 0) {
      toast.error("Votre panier est vide. Ajoutez des articles avant de commander.")
      return
    }

    try {
      const result = await initialiserCommande(isAuthenticated)

      const nextPath = typeof result === "object" ? result.etapeSuivante : result

      if (nextPath) {
        router.push(nextPath)
      } else {
        throw new Error("Impossible de déterminer la prochaine étape")
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes("panier vide")) {
        await recupererPanier()
        toast.error("Votre panier est vide. Ajoutez des articles avant de commander.")
      } else if (error.response?.status !== 401) {
        toast.error(error.message || "Erreur lors de l'initialisation du paiement")
      }
    }
  }

  const handleChangementQuantite = async (idArticle, nouvelleQuantite) => {
    try {
      await mettreAJourQuantite(idArticle, nouvelleQuantite)
    } catch (erreur) {
      toast.error(erreur.message || "Erreur lors de la mise à jour de la quantité")
    }
  }

  const handleSupprimerArticle = async (idArticle) => {
    try {
      await supprimerArticle(idArticle)
    } catch (erreur) {
      toast.error(erreur.message || "Erreur lors de la suppression de l'article")
    }
  }

  const CartItem = ({ article }) => {
    const prix = article.prix_au_moment_ajout || 0
    const imageUrl = getImageUrl(article)

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {imageUrl && !imageErrors[article.id] ? (
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={article.article?.nom_produit || "Produit"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 64px, 80px"
                unoptimized={true}
                onError={() => handleImageError(article.id)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base">
              {article.article?.nom_produit || "Produit"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{article.article?.marque?.libelle || "Marque"}</p>

            <div className="text-xs text-gray-600 mb-2">
              {article.taille?.libelle && `Taille: ${article.taille.libelle}`}
              {article.couleur?.libelle && ` • Couleur: ${article.couleur.libelle}`}
            </div>

            <p className="text-xs sm:text-sm font-medium">{typeof prix === "number" ? prix.toFixed(2) : "0.00"} DT</p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3 sm:gap-4">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => handleChangementQuantite(article.id, Math.max(1, article.quantite - 1))}
              className="px-2 sm:px-3 py-1 hover:bg-gray-100 transition-colors"
              disabled={chargement}
              aria-label="Diminuer la quantité"
            >
              <FaMinus className="w-2 h-2 sm:w-3 sm:h-3" />
            </button>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">{article.quantite}</span>
            <button
              onClick={() => handleChangementQuantite(article.id, article.quantite + 1)}
              className="px-2 sm:px-3 py-1 hover:bg-gray-100 transition-colors"
              disabled={chargement}
              aria-label="Augmenter la quantité"
            >
              <FaPlus className="w-2 h-2 sm:w-3 sm:h-3" />
            </button>
          </div>

          <button
            onClick={() => handleSupprimerArticle(article.id)}
            className="text-red-500 hover:text-red-700 p-1 sm:p-2"
            disabled={chargement}
            aria-label="Supprimer"
          >
            <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (chargement && panier.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-6xl min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm">Chargement du panier...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl min-h-[60vh]">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mon Panier</h1>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          {panier.length === 0 ? (
            <div className="text-center p-6 sm:p-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">Votre panier est vide.</p>
              <Button asChild className="bg-black text-white hover:bg-gray-800 transition-colors">
                <Link href="/store/nouveautes">Explorer nos produits</Link>
              </Button>
            </div>
          ) : (
            panier.map((article) => <CartItem key={`${article.id}-${article.taille?.id}`} article={article} />)
          )}
        </div>

        <div>
          <ResumeCommande showPromoCode={true} showCheckoutButton={true} onCommanderClick={handleCommanderClick} />
        </div>
      </div>

      {panier.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <Button asChild variant="outline" className="text-xs sm:text-sm border-black hover:bg-gray-50">
            <Link href="/store/nouveautes">← Continuer vos achats</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default Panier
