"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"
import { Heart, Plus, X, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import ProductDetailsModel from "../productsModel/[id]/page"

const HommeProductList = ({ produits = [], onEffacerTousFiltres = () => {} }) => {
  const [pageCourante, setPageCourante] = useState(1)
  const [produitAchatRapide, setProduitAchatRapide] = useState(null)
  const produitsParPage = 12

  // Get primary image for each product
  const getPrimaryImage = (produit) => {
    if (!produit) return "/placeholder-image.jpg"

    if (produit.images_couleurs?.length > 0) {
      return produit.images_couleurs[0].image_url
    }

    if (produit.images?.length > 0) {
      return Array.isArray(produit.images) ? produit.images[0] : produit.images
    }

    return "/placeholder-image.jpg"
  }

  const indexDernierProduit = pageCourante * produitsParPage
  const indexPremierProduit = indexDernierProduit - produitsParPage
  const produitsCourants = produits.slice(indexPremierProduit, indexDernierProduit)

  const totalPages = Math.ceil(produits.length / produitsParPage)

  const handleChangementPage = (valeur) => {
    setPageCourante(valeur)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const estNouveauProduit = (produit) => {
    if (!produit?.created_at) return false

    const dateCreation = new Date(produit.created_at)
    const dateActuelle = new Date()
    const differenceJours = (dateActuelle - dateCreation) / (1000 * 60 * 60 * 24)

    return differenceJours <= 30
  }

  const preparerProduitPourModal = (produit) => {
    if (!produit) return null

    const tailles = (produit.tailles || [])
      .map((t) => {
        const quantite = t.quantite || t.ArticleTaille?.quantite || 0
        return {
          id: t.id,
          nom: t.libelle || t.nom,
          quantite: quantite,
        }
      })
      .filter((t) => t.quantite > 0)

    const marque = typeof produit.marque === "object" ? produit.marque?.libelle : produit.marque

    return {
      ...produit,
      marque,
      tailles,
      stock: tailles.reduce((sum, t) => sum + t.quantite, 0),
      primaryImage: getPrimaryImage(produit),
    }
  }

  const handleClicAchatRapide = (produit) => {
    if (!produit?.id) {
      toast.error("Données produit invalides")
      return
    }
    setProduitAchatRapide(preparerProduitPourModal(produit))
  }

  const handleAjoutPanier = async ({ produit, tailleSelectionnee, quantite }) => {
    try {
      if (!produit?.id || !tailleSelectionnee?.id) {
        throw new Error("Produit ou taille invalide")
      }

      const response = await axios.post(
        "http://localhost:5000/panier/ajouterAuPanier",
        {
          articles: [
            {
              article_id: produit.id,
              quantite: quantite,
              taille_id: tailleSelectionnee.id,
              prix_au_moment_ajout: produit.prix_final || produit.prix,
            },
          ],
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        toast.success("Produit ajouté au panier avec succès")
        return true
      } else {
        toast.error(response.data.message || "Erreur lors de l'ajout au panier")
        return false
      }
    } catch (erreur) {
      console.error("Erreur lors de l'ajout au panier:", erreur)
      toast.error(erreur.response?.data?.message || "Erreur lors de l'ajout au panier")
      return false
    }
  }

  const handleAchatRapide = async ({ produit, tailleSelectionnee }) => {
    const ajoute = await handleAjoutPanier({
      produit,
      tailleSelectionnee,
      quantite: 1,
    })

    if (ajoute) {
      window.location.href = "/caisse"
    }
  }

  return (
    <div className="w-full">
      {produitsCourants.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
            {produitsCourants.map((produit) => {
              const primaryImage = getPrimaryImage(produit)
              const marque = typeof produit.marque === "object" ? produit.marque?.libelle : produit.marque

              return (
                <div key={produit.id || Math.random()} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-md bg-gray-50 relative">
                    <Link href={`/store/products/${produit.id}`} className="block h-full w-full">
                      <Image
                        src={primaryImage || "/placeholder.svg"}
                        alt={produit.nom_produit || "Image du produit"}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.jpg"
                        }}
                      />
                    </Link>

                    {estNouveauProduit(produit) && (
                      <Badge className="absolute top-2 left-2 bg-black text-white font-mono text-xs">NOUVEAU</Badge>
                    )}
                  </div>

                  <div className="mt-3 text-center relative">
                    <p className="text-xs text-gray-600 font-mono tracking-wider uppercase transition-opacity duration-300">
                      {marque || "Marque inconnue"}
                    </p>
                    <h3 className="mt-1 text-sm font-medium text-gray-900 font-mono group-hover:opacity-0 transition-opacity duration-300">
                      {produit.nom_produit || "Produit sans nom"}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900 font-mono group-hover:opacity-0 transition-opacity duration-300">
                      {produit.prix_final || produit.prix || 0} DT
                    </p>

                    <div className="absolute inset-0 flex items-center justify-center p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-black hover:bg-white hover:text-black border border-black text-white text-xs rounded-full"
                          onClick={(e) => {
                            e.preventDefault()
                            handleClicAchatRapide(produit)
                          }}
                        >
                          Achat Rapide
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white text-orange-500">
                          <Heart className="h-5 w-5" />
                          <span className="sr-only">Ajouter aux favoris</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pageCourante > 1) handleChangementPage(pageCourante - 1)
                    }}
                    className={pageCourante === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={pageNum === pageCourante}
                        onClick={(e) => {
                          e.preventDefault()
                          handleChangementPage(pageNum)
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <span className="px-2">...</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={totalPages === pageCourante}
                        onClick={(e) => {
                          e.preventDefault()
                          handleChangementPage(totalPages)
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pageCourante < totalPages) handleChangementPage(pageCourante + 1)
                    }}
                    className={pageCourante === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">Aucun produit ne correspond à vos filtres.</p>
          <Button variant="outline" className="mt-4" onClick={onEffacerTousFiltres}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      <Dialog open={!!produitAchatRapide} onOpenChange={(open) => !open && setProduitAchatRapide(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="sm:hidden sticky top-0 bg-white z-10 p-4 border-b">
            <DialogTitle>Achat Rapide</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          {produitAchatRapide && (
            <ProductDetailsModel
              productId={produitAchatRapide.id}
              onAddToCart={handleAjoutPanier}
              onQuickBuy={handleAchatRapide}
              customButtons={({ product, selectedSize, isAddingToCart }) => (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    className={`flex items-center gap-2 ${
                      !selectedSize || product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!selectedSize || product.stock <= 0 || isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Ajouter au panier
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    className={`${!selectedSize || product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!selectedSize || product.stock <= 0 || isAddingToCart}
                  >
                    Achetez maintenant
                  </Button>
                </div>
              )}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HommeProductList