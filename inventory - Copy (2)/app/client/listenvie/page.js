"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Trash2, ShoppingCart, Share2, Eye } from "lucide-react"
import { useClient } from "@/hooks/useClient";
import { toast } from 'sonner';

export default function Mywishlist() {
  const { getWishlist, addToCart: apiAddToCart, removeFromWishlist: apiRemoveFromWishlist } = useClient();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const { success, data } = await getWishlist();
        if (success) {
            setWishlistItems(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWishlist();
  }, [getWishlist]);

  const removeFromWishlist = async (id) => {
    try {
      const { success } = await apiRemoveFromWishlist(id);
      if (success) {
        setWishlistItems(wishlistItems.filter((item) => item.id !== id));
        toast.success("Article retiré de votre liste d'envies");
      }
    } catch (error) {
      toast.error("Échec de la suppression de l'article");
    }
  };

  const addToCart = async (id) => {
    try {
      const { success } = await apiAddToCart(id);
      if (success) {
        toast.success("Article ajouté au panier");
        // Optionally remove from wishlist
        // removeFromWishlist(id);
      }
    } catch (error) {
      toast.error("Échec de l'ajout au panier");
    }
  };

  const shareItem = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Découvrez ${item.name} à ${item.price.toFixed(2)}€`,
        url: `/product/${item.id}`,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(`${item.name} - ${window.location.origin}/product/${item.id}`);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  // Filter and sort logic remains the same
  const filteredItems = wishlistItems.filter((item) => {
    if (filterCategory === "all") return true;
    return item.category === filterCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortOrder) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
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
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Ma liste d&apos;envies</h2>
        <p className="text-gray-600 text-sm">{wishlistItems.length} article(s)</p>
      </div>

      {/* Filters and sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="sm:w-1/2">
          <label htmlFor="category-filter" className="block text-sm font-medium mb-1">
            Filtrer par catégorie
          </label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-sm text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "Toutes les catégories" : category}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-1/2">
          <label htmlFor="sort-order" className="block text-sm font-medium mb-1">
            Trier par
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="default">Par défaut</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Wishlist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-sm overflow-hidden group">
            <div className="relative pt-[100%]">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover p-4" />

              {/* Quick action buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => removeFromWishlist(item.id)}
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
              <div
                className={`absolute bottom-2 left-2 px-2 py-1 text-xs rounded-full ${
                  item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {item.available ? "En stock" : "Indisponible"}
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{item.category}</div>
              <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-2">{item.name}</h3>
              <p className="text-gray-900 font-semibold mb-3">{item.price.toFixed(2)} €</p>

              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(item.id)}
                  disabled={!item.available}
                  className={`flex-1 py-2 px-3 text-xs flex justify-center items-center gap-1 ${
                    item.available
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } transition-colors rounded-sm`}
                >
                  <ShoppingCart size={14} />
                  <span>Ajouter au panier</span>
                </button>

                <Link
                  href={`/product/${item.id}`}
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
    </div>
  )
}
