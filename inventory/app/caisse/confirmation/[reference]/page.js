"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import { Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ConfirmationPage({ params }) {
  const router = useRouter()
  const { obtenirConfirmationCommande, viderPanier } = usePanier()
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reference = params?.reference

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!reference) {
          throw new Error("Reference parameter is missing")
        }

        const orderData = await obtenirConfirmationCommande(reference)

        if (!orderData) {
          throw new Error("Order data not found")
        }

        setCommande(orderData)

        // Clear cart and shipping info after successful load
        await viderPanier()
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("shipping_method")
          sessionStorage.removeItem("shipping_cost")
        }
      } catch (error) {
        console.error("Error loading order:", error)
        setError(error.message)
        toast.error(error.message || "Erreur lors du chargement de la commande")
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [reference, obtenirConfirmationCommande, viderPanier])

  const handleDownloadInvoice = () => {
    if (!commande?.reference) return

    const backendUrl = "http://localhost:5000"
    window.open(`${backendUrl}/commandes/${commande.reference}/facture`, "_blank")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (error || !commande) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-xl font-bold mb-4">Erreur lors du chargement de la commande</h1>
          <p className="text-red-500 mb-4">{error || "Commande non trouvée"}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push("/store/nouveautes")}>Retour à la boutique</Button>
            <Button variant="outline" onClick={() => router.push("/compte/commandes")}>
              Voir mes commandes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Confirmation de commande</h1>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Référence: {commande.reference}</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Passée le {format(new Date(commande.created_at), "PPP", { locale: fr })}
          </p>
        </div>
        <Button
          onClick={handleDownloadInvoice}
          variant="outline"
          className="flex items-center gap-2 self-start md:self-auto text-xs sm:text-sm"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          Télécharger la facture
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 rounded-lg border">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Adresse de livraison</h2>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <p>
              {commande.adresse.nom_complet ||
                `${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`}
            </p>
            <p>{commande.adresse.adresse}</p>
            {commande.adresse.complement && <p>{commande.adresse.complement}</p>}
            <p>
              {commande.adresse.code_postal} {commande.adresse.ville}
            </p>
            <p>{commande.adresse.gouvernorat}</p>
            <p>Tél: {commande.adresse.telephone}</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-lg border">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Résumé de la commande</h2>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <span className="capitalize">{commande.statut.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Méthode de livraison:</span>
              <span className="capitalize">{commande.methode_livraison}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Méthode de paiement:</span>
              <span className="capitalize">{commande.methode_paiement}</span>
            </div>
            <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{commande.prix_total.toFixed(2)} DT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-lg border mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Articles commandés</h2>
        <div className="space-y-3 sm:space-y-4">
          {commande.articles?.map((article) => (
            <div
              key={`${article.id}-${article.couleur?.id}-${article.taille?.id}`}
              className="flex items-start py-3 sm:py-4 border-b last:border-b-0"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {article.image && (
                  <Image
                    width={80}
                    height={80}
                    src={article.image || "/placeholder.svg"}
                    alt={article.nom_produit}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <h3 className="font-medium text-sm sm:text-base">{article.nom_produit}</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {article.marque?.libelle}
                  {article.couleur && ` - ${article.couleur.libelle}`}
                  {article.taille && ` - Taille ${article.taille.libelle}`}
                </p>
                <p className="text-xs sm:text-sm">Quantité: {article.quantite}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm sm:text-base">
                  {(article.prix_unitaire * article.quantite).toFixed(2)} DT
                </p>
                <p className="text-xs sm:text-sm text-gray-500">{article.prix_unitaire.toFixed(2)} DT l&apos;unité</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6">
        <Button onClick={() => router.push("/store/nouveautes")} variant="outline" className="text-xs sm:text-sm">
          Retour à la boutique
        </Button>
        <Button
          onClick={() => router.push("/compte/commandes")}
          className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm"
        >
          Voir mes commandes
        </Button>
      </div>
    </div>
  )
}
