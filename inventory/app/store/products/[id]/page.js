"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Star, Heart, Share2, Loader2, Minus, Plus, Check, ChevronDown, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { usePanier } from "@/hooks/use-panier"
import { toast } from "sonner"
import BreadcrumbArticle from "@/app/components/Breadcrumb/BreadcrumbArticle"
import { useAuth } from "@/app/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWishlist } from "@/hooks/useWishlist"
import { ProductReviews } from "./ProductReviews"

export default function DetailsProduit() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [produit, setProduit] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [couleurSelectionnee, setCouleurSelectionnee] = useState(null)
  const [taillesSelectionnees, setTaillesSelectionnees] = useState([])
  const [imagesDisponibles, setImagesDisponibles] = useState([])
  const [imageActive, setImageActive] = useState(0)
  const [afficherConseilsLivraison, setAfficherConseilsLivraison] = useState(false)
  const [afficherErreurTaille, setAfficherErreurTaille] = useState(false)
  const [chargementAjout, setChargementAjout] = useState(false)
  const { panier, chargement: chargementPanier, ajouterArticle, recupererPanier } = usePanier()
  const { basculerListeEnvies, estDansListeEnvies, chargement: chargementWishlist } = useWishlist()
const [nombreAvis, setNombreAvis] = useState(produit?.nombre_avis || 0);
const [reviewStats, setReviewStats] = useState({
  average: 0,
  count: 0
});
const fetchReviewStats = async () => {
  try {
    const response = await fetch(`http://localhost:5000/avis/getReviewStats/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch review stats");
    }
    const data = await response.json();
    if (data.success) {
      setReviewStats({
        average: data.data.average,
        count: data.data.count
      });
    }
  } catch (error) {
    console.error("Error fetching review stats:", error);
  }
};
  const estEnPromotion = () => {
    return produit?.prix_final && produit.prix_final < produit.prix
  }


  const estNouveauProduit = () => {
    if (!produit?.created_at) return false

    const dateCreation = new Date(produit.created_at)
    const dateActuelle = new Date()
    const differenceJours = (dateActuelle - dateCreation) / (1000 * 60 * 60 * 24)

    return differenceJours <= 30
  }

  const verifierStatutStock = () => {
    if (!couleurSelectionnee || !produit?.tailles_par_couleur[couleurSelectionnee.id]?.tailles) {
      return null
    }

    const tailles = produit.tailles_par_couleur[couleurSelectionnee.id].tailles
    const toutesEnRupture = tailles.every((t) => t.quantite <= 0)
    const certainesEnRupture = tailles.some((t) => t.quantite <= 0)

    if (toutesEnRupture) {
      return <div className="text-red-500 text-xs sm:text-sm mt-1">Rupture de stock pour toutes les tailles</div>
    }

    if (certainesEnRupture) {
      const taillesEnRupture = tailles
        .filter((t) => t.quantite <= 0)
        .map((t) => t.libelle)
        .join(", ")

      return (
        <div className="text-red-500 text-xs sm:text-sm mt-1">
          Rupture de stock pour les tailles: {taillesEnRupture}
        </div>
      )
    }

    return <div className="text-green-600 text-xs sm:text-sm mt-1">En stock</div>
  }

  const recupererProduit = async () => {
    try {
      setChargement(true)
      const reponse = await fetch(`http://localhost:5000/articles/obtenirArticleParId/${id}`)

      if (!reponse.ok) {
        throw new Error("Échec de la récupération du produit")
      }

      const donnees = await reponse.json()
      if (!donnees.success || !donnees.donnees) {
        throw new Error("Données produit non trouvées")
      }

      const produitData = donnees.donnees

      const produitValide = {
        ...produitData,
        nom_produit: produitData.nom_produit || "Nom inconnu",
        prix_final: produitData.prix_final || 0,
        prix: produitData.prix || 0,
        description: produitData.description || "",
        stock: produitData.stock || 0,
        conseils: produitData.conseils || "",
        marque: produitData.marque?.libelle || "",
        couleurs: Array.isArray(produitData.couleurs)
          ? produitData.couleurs.map((c) => ({
              id: c.id,
              libelle: c.libelle || "Couleur inconnue",
              hexcode: c.hexcode || "#FFFFFF",
              created_at: c.created_at,
              updated_at: c.updated_at,
            }))
          : [],
        tailles_par_couleur: produitData.tailles_par_couleur || {},
        images_par_couleur: produitData.images_par_couleur || {},
      }

      setProduit(produitValide)

      if (produitValide.couleurs.length > 0) {
        const couleurParDefaut = produitValide.couleurs[0]
        setCouleurSelectionnee(couleurParDefaut)

        if (produitValide.images_par_couleur[couleurParDefaut.id]) {
          setImagesDisponibles(produitValide.images_par_couleur[couleurParDefaut.id] || [])
        }
      }
    } catch (erreur) {
      console.error("Erreur lors de la récupération du produit:", erreur)
      setErreur(erreur.message || "Échec du chargement des détails du produit")
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (id) {
      recupererProduit();
fetchReviewStats();    }
  }, [id])


  useEffect(() => {
    if (couleurSelectionnee && produit) {
      if (produit.images_par_couleur[couleurSelectionnee.id]) {
        setImagesDisponibles(produit.images_par_couleur[couleurSelectionnee.id] || [])
      }
      setImageActive(0)
      setTaillesSelectionnees([])
      setAfficherErreurTaille(false)
    }
  }, [couleurSelectionnee, produit])

  const basculerSelectionTaille = (taille) => {
    if (!taille?.id || taille.quantite <= 0) return

    setTaillesSelectionnees((prev) => {
      const indexExistant = prev.findIndex((t) => t.id === taille.id)

      if (indexExistant >= 0) {
        return prev.filter((t) => t.id !== taille.id)
      } else {
        return [
          ...prev,
          {
            id: taille.id,
            libelle: taille.libelle,
            quantite: 1,
            stockDisponible: taille.quantite,
          },
        ]
      }
    })
    setAfficherErreurTaille(false)
  }

  const mettreAJourQuantiteTaille = (tailleId, nouvelleQuantite) => {
    setTaillesSelectionnees((prev) =>
      prev.map((taille) =>
        taille.id === tailleId
          ? { ...taille, quantite: Math.max(1, Math.min(nouvelleQuantite, taille.stockDisponible)) }
          : taille,
      ),
    )
  }

  const handleAjoutAuPanier = async () => {
    if (!couleurSelectionnee || taillesSelectionnees.length === 0) {
      setAfficherErreurTaille(true)
      return
    }

    setChargementAjout(true)
    try {
      for (const taille of taillesSelectionnees) {
        const succes = await ajouterArticle(produit.id, couleurSelectionnee.id, taille.id, taille.quantite)

        if (!succes) {
          throw new Error("Erreur lors de l'ajout au panier")
        }
      }

      await recupererPanier()

      const message =
        taillesSelectionnees.length === 1
          ? `${produit.nom_produit} ajouté au panier avec succès`
          : `${taillesSelectionnees.length} articles ajoutés au panier avec succès`

      toast.success(message, {
        action: {
          label: "Voir le panier",
          onClick: () => router.push("/caisse/panier"),
        },
      })
    } catch (erreur) {
      toast.error(erreur.message || "Erreur lors de l'ajout au panier")
    } finally {
      setChargementAjout(false)
    }
  }

  const handleWishlistClick = async () => {
    if (!produit?.id) return
    await basculerListeEnvies(produit.id)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: produit.nom_produit,
          text: `Découvrez ${produit.nom_produit} sur notre boutique`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Lien copié dans le presse-papiers")
      } catch (err) {
        toast.error("Impossible de copier le lien")
      }
    }
  }

  const taillesDisponibles = couleurSelectionnee
    ? produit?.tailles_par_couleur[couleurSelectionnee.id]?.tailles || []
    : []
  const desactiverAjoutPanier =
    !couleurSelectionnee || taillesSelectionnees.length === 0 || chargementPanier || chargementAjout

  if (chargement) {
    return (
      <div className="container min-h-[50vh] flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="container py-12 text-center space-y-4">
        <div className="text-red-500 mb-4 text-sm">{erreur}</div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={recupererProduit} variant="outline" size="sm">
            Réessayer
          </Button>
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  if (!produit) {
    return (
      <div className="container py-12 text-center space-y-4">
        <p className="text-gray-500">Produit non trouvé</p>
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    )
  }

  return (
    <>
      <BreadcrumbArticle />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Mobile Image Gallery */}
          <div className="lg:hidden">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
              {imagesDisponibles.length > 0 ? (
                <Image
                  src={imagesDisponibles[imageActive] || "/placeholder.svg"}
                  alt={produit.nom_produit}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">Image non disponible</div>
              )}
            </div>

            {imagesDisponibles.length > 1 && (
              <ScrollArea className="w-full mt-3">
                <div className="flex gap-2 pb-2">
                  {imagesDisponibles.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setImageActive(index)}
                      className={`relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                        imageActive === index ? "ring-2 ring-black" : "ring-1 ring-gray-200 hover:ring-gray-300"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg?height=64&width=64"}
                        alt={`${produit.nom_produit} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Desktop Image Gallery */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
                {imagesDisponibles.length > 0 ? (
                  <Image
                    src={imagesDisponibles[imageActive] || "/placeholder.svg"}
                    alt={produit.nom_produit}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Image non disponible</div>
                )}
              </div>

              {imagesDisponibles.length > 1 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {imagesDisponibles.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setImageActive(index)}
                      className={`relative aspect-square overflow-hidden rounded-md transition-all ${
                        imageActive === index ? "ring-2 ring-black" : "hover:ring-1 hover:ring-gray-300"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg?height=120&width=120"}
                        alt={`${produit.nom_produit} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">{produit.nom_produit}</h1>
                  {produit.marque && <span className="text-sm sm:text-base text-gray-500">- {produit.marque}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {estEnPromotion() && <Badge className="bg-red-600 text-white font-mono text-xs">EN PROMO</Badge>}
                  {estNouveauProduit() && !estEnPromotion() && (
                    <Badge className="bg-black text-white font-mono text-xs">NOUVEAU</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(reviewStats.average)
                            ? "fill-current text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">({reviewStats.count} avis)</span>
                </div>

                 <div className="flex items-center gap-4 py-2">
                  <span className="text-2xl sm:text-3xl font-bold">{produit.prix_final} DT</span>
                  {estEnPromotion() && <span className="text-lg text-gray-500 line-through">{produit.prix} DT</span>}
                 </div>

                 <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{produit.description}</p>
               </div>

              <Separator />

              {/* Color Selection */}
              {produit.couleurs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-medium">Couleur</h3>
                  <div className="flex flex-wrap gap-2">
                    {produit.couleurs.map((couleur) => (
                      <button
                        key={couleur.id}
                        onClick={() => setCouleurSelectionnee(couleur)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                          couleurSelectionnee?.id === couleur.id
                            ? "border-black bg-black/5 font-medium"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: couleur.hexcode }}
                        />
                        {couleur.libelle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {couleurSelectionnee && taillesDisponibles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm sm:text-base font-medium">Taille</h3>
                    <span className="text-sm text-gray-500">{taillesSelectionnees.length} sélectionné(s)</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    {taillesDisponibles.map((taille) => {
                      const isDisabled = taille.quantite <= 0
                      const isSelected = taillesSelectionnees.some((t) => t.id === taille.id)

                      return (
                        <button
                          key={taille.id}
                          onClick={() => !isDisabled && basculerSelectionTaille(taille)}
                          disabled={isDisabled}
                          className={`relative py-3 px-2 border rounded-lg text-sm transition-all ${
                            isSelected ? "bg-black text-white border-black" : "border-gray-300 hover:bg-gray-50"
                          } ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer"}`}
                        >
                          {taille.libelle}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {verifierStatutStock()}
                  {afficherErreurTaille && (
                    <p className="text-sm text-red-500">Veuillez sélectionner au moins une taille</p>
                  )}
                </div>
              )}

              {/* Quantity Selection */}
              {taillesSelectionnees.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">Quantité par taille</h3>
                    <div className="space-y-3">
                      {taillesSelectionnees.map((taille) => (
                        <div key={taille.id} className="flex items-center justify-between">
                          <span className="text-sm">Taille {taille.libelle}</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => mettreAJourQuantiteTaille(taille.id, taille.quantite - 1)}
                              className="px-3 py-2 hover:bg-gray-100 transition-colors rounded-l-lg"
                              disabled={taille.quantite <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm min-w-[50px] text-center border-x border-gray-300">
                              {taille.quantite}
                            </span>
                            <button
                              onClick={() => mettreAJourQuantiteTaille(taille.id, taille.quantite + 1)}
                              className="px-3 py-2 hover:bg-gray-100 transition-colors rounded-r-lg"
                              disabled={taille.quantite >= taille.stockDisponible}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleAjoutAuPanier}
                  className="flex-1 bg-black hover:bg-gray-800 text-white py-3"
                  disabled={desactiverAjoutPanier}
                >
                  {chargementAjout ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ajout en cours...
                    </span>
                  ) : (
                    "Ajouter au panier"
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="p-3"
                    onClick={handleWishlistClick}
                    disabled={chargementWishlist}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={produit?.id && estDansListeEnvies(produit.id) ? "currentColor" : "none"}
                    />
                  </Button>
                  <Button variant="outline" size="icon" className="p-3" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description" className="text-sm sm:text-base">
                Description
              </TabsTrigger>
<TabsTrigger value="reviews" className="text-sm sm:text-base">
  Avis ({reviewStats.count})
</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">{produit.description}</p>
                  </div>
                  {produit.conseils && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-base font-medium mb-3">Conseils d&apos;entretien</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{produit.conseils}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="py-6">
              <ProductReviews productId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
