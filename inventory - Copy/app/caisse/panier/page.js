'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { usePanier } from '@/hooks/use-panier'
import { toast } from 'sonner'
import ResumeCommande from '@/app/components/caisse/CartSummary'
import { useAuth } from '@/app/contexts/AuthContext'

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
    initialiserCommande
  } = usePanier()

  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    recupererPanier()
  }, [recupererPanier])

  const getImageUrl = (article) => {
    if (!article?.article?.images_couleurs?.[0]?.image_url) return null;
    const url = article.article.images_couleurs[0].image_url;
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
  };

  const handleImageError = (articleId) => {
    setImageErrors(prev => ({ ...prev, [articleId]: true }));
  };

  const handleCommanderClick = async () => {
    if (panier.length === 0) {
      toast.error('Votre panier est vide. Ajoutez des articles avant de commander.');
      return;
    }
    
    try {
      const result = await initialiserCommande(isAuthenticated);
      
      const nextPath = typeof result === 'object' 
        ? result.etapeSuivante 
        : result;
      
      if (nextPath) {
        router.push(nextPath);
      } else {
        throw new Error('Impossible de déterminer la prochaine étape');
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('panier vide')) {
        await recupererPanier();
        toast.error('Votre panier est vide. Ajoutez des articles avant de commander.');
      } else if (error.response?.status !== 401) {
        toast.error(error.message || "Erreur lors de l'initialisation du paiement");
      }
    }
  };

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
    const prix = article.prix_au_moment_ajout || 0;
    const imageUrl = getImageUrl(article);
  
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {imageUrl && !imageErrors[article.id] ? (
              <Image
                src={imageUrl}
                alt={article.article?.nom_produit || "Produit"}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={true}
                onError={() => handleImageError(article.id)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                Image
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {article.article?.nom_produit || "Produit"}
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              {article.article?.marque?.libelle || "Marque"}
            </p>
            
            <div className="text-xs text-gray-600 mb-2">
              {article.taille?.libelle && `Taille: ${article.taille.libelle}`}
              {article.couleur?.libelle && ` • Couleur: ${article.couleur.libelle}`}
            </div>
            
            <p className="text-sm font-medium">
              {typeof prix === 'number' ? prix.toFixed(2) : '0.00'} DT
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => handleChangementQuantite(article.id, Math.max(1, article.quantite - 1))}
              className="px-3 py-1 hover:bg-gray-100 transition-colors"
              disabled={chargement}
            >
              <FaMinus className="w-3 h-3" />
            </button>
            <span className="px-3 py-1 text-sm">{article.quantite}</span>
            <button
              onClick={() => handleChangementQuantite(article.id, article.quantite + 1)}
              className="px-3 py-1 hover:bg-gray-100 transition-colors"
              disabled={chargement}
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          
          <button 
            onClick={() => handleSupprimerArticle(article.id)} 
            className="text-red-500 hover:text-red-700 p-2"
            disabled={chargement}
            aria-label="Supprimer"
          >
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (chargement && panier.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-6xl min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm">Chargement du panier...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6">Mon Panier</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {panier.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">Votre panier est vide.</p>
              <Link 
                href="/store/nouveautes" 
                className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Explorer nos produits
              </Link>
            </div>
          ) : (
            panier.map((article) => (
              <CartItem key={`${article.id}-${article.taille?.id}`} article={article} />
            ))
          )}
        </div>

        <ResumeCommande 
          afficherCodePromo={true}
          afficherBoutonCommande={true}
          onCommanderClick={handleCommanderClick}
        />
      </div>

      {panier.length > 0 && (
        <div className="mt-8">
          <Link
            href="/store/nouveautes"
            className="inline-flex items-center px-6 py-2 border border-black rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Continuer vos achats
          </Link>
        </div>
      )}
    </div>
  )
}

export default Panier;