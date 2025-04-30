'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { usePanier } from '@/hooks/use-panier'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ConfirmationPage({ params }) {
  const router = useRouter()
  const { obtenirConfirmationCommande, viderPanier } = usePanier()
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Properly unwrap the params promise
  const unwrappedParams = use(params)
  const reference = unwrappedParams?.reference

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!reference) {
          throw new Error('Reference parameter is missing')
        }

        const orderData = await obtenirConfirmationCommande(reference)
        
        if (!orderData) {
          throw new Error('Order data not found')
        }

        setCommande(orderData)
        
        // Clear cart and shipping info after successful load
        await viderPanier()
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('shipping_method')
          sessionStorage.removeItem('shipping_cost')
        }
      } catch (error) {
        console.error('Error loading order:', error)
        setError(error.message)
        toast.error(error.message || 'Erreur lors du chargement de la commande')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [reference]) // Now using the unwrapped reference as dependency

  const handleDownloadInvoice = () => {
    if (!commande?.reference) return
    
    const backendUrl ='http://localhost:5000'
    window.open(`${backendUrl}/commandes/${commande.reference}/facture`, '_blank')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <p>Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (error || !commande) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-xl font-bold mb-4">Erreur lors du chargement de la commande</h1>
          <p className="text-red-500 mb-4">{error || 'Commande non trouvée'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/store/nouveautes')}>
              Retour à la boutique
            </Button>
            <Button variant="outline" onClick={() => router.push('/compte/commandes')}>
              Voir mes commandes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Confirmation de commande</h1>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold">Référence: {commande.reference}</h2>
          <p className="text-sm text-gray-600">
            Passée le {format(new Date(commande.created_at), 'PPP', { locale: fr })}
          </p>
        </div>
        <Button 
          onClick={handleDownloadInvoice}
          variant="outline"
          className="flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          Télécharger la facture
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Adresse de livraison</h2>
          <div className="space-y-2">
            <p>{commande.adresse.nom_complet || `${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`}</p>
            <p>{commande.adresse.adresse}</p>
            {commande.adresse.complement && <p>{commande.adresse.complement}</p>}
            <p>{commande.adresse.code_postal} {commande.adresse.ville}</p>
            <p>{commande.adresse.gouvernorat}</p>
            <p>Tél: {commande.adresse.telephone}</p>
          </div>
        </div>
        
        <div className="p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <span className="capitalize">{commande.statut.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Méthode de livraison:</span>
              <span className="capitalize">{commande.methode_livraison}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Méthode de paiement:</span>
              <span className="capitalize">{commande.methode_paiement}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{commande.prix_total.toFixed(2)} DT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg border mb-8">
        <h2 className="text-lg font-semibold mb-4">Articles commandés</h2>
        <div className="space-y-4">
          {commande.articles?.map((article) => (
            <div 
              key={`${article.id}-${article.couleur?.id}-${article.taille?.id}`} 
              className="flex items-start py-4 border-b last:border-b-0"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {article.image && (
                  <Image
                    width={80}
                    height={80} 
                    src={article.image} 
                    alt={article.nom_produit}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium">{article.nom_produit}</h3>
                <p className="text-sm text-gray-600">
                  {article.marque?.libelle}
                  {article.couleur && ` - ${article.couleur.libelle}`}
                  {article.taille && ` - Taille ${article.taille.libelle}`}
                </p>
                <p className="text-sm">Quantité: {article.quantite}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{(article.prix_unitaire * article.quantite).toFixed(2)} DT</p>
                <p className="text-sm text-gray-500">{article.prix_unitaire.toFixed(2)} DT l&apos;unité</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
        <Button 
          onClick={() => router.push('/store/nouveautes')}
          variant="outline"
        >
          Retour à la boutique
        </Button>
        <Button 
          onClick={() => router.push('/compte/commandes')}
          className="bg-primary hover:bg-primary-dark"
        >
          Voir mes commandes
        </Button>
      </div>
    </div>
  )
}