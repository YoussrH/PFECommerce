"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Trash2, ShoppingCart, Share2, Eye, Filter } from "lucide-react"
import { toast } from 'sonner'
import { useWishlist } from '@/hooks/useWishlist'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ProductDetailsModel from "@/app/store/productsModel/[id]/page"

export default function Mywishlist() {
  const { 
    listeEnvies: wishlistItems, 
    chargement: loading, 
    erreur: error,
    supprimerDeListeEnvies: removeFromWishlist,
    obtenirListeEnvies: fetchWishlist
  } = useWishlist();
  
  const [sortOrder, setSortOrder] = useState("default");
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const [showSortOptions, setShowSortOptions] = useState(false);

  const shareItem = (item) => {
    const productName = item.article.nom_produit;
    const productPrice = item.article.prix_final.toFixed(2);
    const productUrl = `/store/products/${item.article.id}`;

    if (navigator.share) {
      navigator.share({
        title: productName,
        text: `Découvrez ${productName} à ${productPrice}€`,
        url: productUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${productName} - ${window.location.origin}${productUrl}`);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      const success = await removeFromWishlist(itemId);
      if (success) {
        toast.success("Article retiré de votre liste d'envies");
      }
    } catch (error) {
      toast.error("Échec de la suppression de l'article");
    }
  };

  // Sort logic
  const sortedItems = [...wishlistItems].sort((a, b) => {
    switch (sortOrder) {
      case "price-asc": return a.article.prix_final - b.article.prix_final;
      case "price-desc": return b.article.prix_final - a.article.prix_final;
      case "name-asc": return a.article.nom_produit.localeCompare(b.article.nom_produit);
      case "name-desc": return b.article.nom_produit.localeCompare(a.article.nom_produit);
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex justify-center items-center py-12">
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchWishlist}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Heart size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Votre liste d&apos;envies est vide</h2>
          <p className="text-gray-600 mb-6">
            Parcourez notre catalogue et ajoutez des articles à votre liste d&apos;envies
          </p>
          <Link href="/shop" className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors">
            Découvrir nos produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg md:text-xl font-semibold">Ma liste d&apos;envies</h2>
        <div className="relative">
          <button 
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1 text-sm hover:bg-gray-100 p-2 rounded"
          >
            <Filter size={16} />
            <span>Trier</span>
          </button>
          
          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setShowSortOptions(false);
                }}
                className="w-full p-2 text-sm border-none focus:ring-0"
              >
                <option value="default">Par défaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name-asc">Nom (A-Z)</option>
                <option value="name-desc">Nom (Z-A)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-6">{wishlistItems.length} article(s)</p>

      {/* Wishlist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-sm overflow-hidden group">
            <div className="relative pt-[100%]">
              <Link href={`/store/products/${item.article.id}`} className="block h-full w-full">
                <Image 
                  src={item.article.images_couleurs[0]?.image_url || "/placeholder.svg"} 
                  alt={item.article.nom_produit} 
                  fill 
                  className="object-cover p-4" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>

              {/* Quick action buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => shareItem(item)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  aria-label="Partager"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Availability badge */}
              <div className="absolute bottom-2 left-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                En stock
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{item.article.marque.libelle}</div>
              <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-2">{item.article.nom_produit}</h3>
              <p className="text-gray-900 font-semibold mb-3">{item.article.prix_final.toFixed(2)} DT</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setQuickAddProductId(item.article.id)}
                  className="flex-1 py-2 px-3 text-xs flex justify-center items-center gap-1 bg-black text-white hover:bg-gray-800 transition-colors rounded-sm"
                >
                  <ShoppingCart size={14} />
                  <span>Ajouter au panier</span>
                </button>

                <Link
                  href={`/store/products/${item.article.id}`}
                  className="py-2 px-3 border border-gray-300 text-xs flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors rounded-sm"
                >
                  <Eye size={14} />
                  <span className="hidden sm:inline">Voir</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state for filtered results */}
      {sortedItems.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-sm">
          <p className="text-gray-500">Aucun article ne correspond à vos critères de filtrage</p>
          <button 
            onClick={() => {
              setSortOrder("default");
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Tips section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-3">À propos de votre liste d&apos;envies</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>Les articles de votre liste d&apos;envies sont sauvegardés pour une durée illimitée.</li>
          <li>Vous serez notifié si un article de votre liste d&apos;envies est en promotion.</li>
          <li>Vous pouvez partager votre liste d&apos;envies avec vos amis et votre famille.</li>
        </ul>
      </div>

      {/* Quick add modal */}
      <Dialog open={!!quickAddProductId} onOpenChange={(open) => !open && setQuickAddProductId(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="hidden sm:block">
            <DialogTitle>Ajouter au panier</DialogTitle>
          </DialogHeader>
          {quickAddProductId && (
            <ProductDetailsModel 
              productId={quickAddProductId}
              onClose={() => setQuickAddProductId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}