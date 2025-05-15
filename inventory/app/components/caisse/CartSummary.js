// components/caisse/CartSummary.js
import { useState, useEffect } from 'react'
import { usePanier } from '@/hooks/use-panier'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const ResumeCommande = ({ showCheckoutButton = true, onCommanderClick }) => {
  const {
    panier,
    getTotal,
    getSubtotal,
    shippingCost,
    initShipping,
    chargement,
    remise,
  } = usePanier()

  const [montantTotal, setMontantTotal] = useState("0.00")
  const [sousTotal, setSousTotal] = useState("0.00")
  const [fraisLivraison, setFraisLivraison] = useState("0.00")

  useEffect(() => {
    initShipping()
    const calculateTotals = () => {
      setSousTotal(getSubtotal())
      setFraisLivraison(shippingCost.toFixed(2))
      setMontantTotal(getTotal())
    }
    calculateTotals()
  }, [panier, shippingCost, getTotal, getSubtotal, initShipping, remise])

  return (
    <div className="bg-white p-4 md:p-6 rounded-sm shadow-sm border border-gray-100 h-fit sticky top-4">
      <h3 className="text-xs md:text-sm font-bold mb-3 md:mb-4">
        RÉSUMÉ DE LA COMMANDE ({panier.reduce((acc, item) => acc + item.quantite, 0)} articles)
      </h3>

      <div className="border-t border-gray-200 pt-3 md:pt-4 space-y-2 md:space-y-3">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Sous-total</span>
          <span>{sousTotal} DT</span>
        </div>

        {remise > 0 && (
          <div className="flex justify-between text-xs md:text-sm text-green-600">
            <span>Réduction</span>
            <span>-{remise.toFixed(2)} DT</span>
          </div>
        )}

        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Livraison</span>
          <span>{fraisLivraison} DT</span>
        </div>

        <div className="flex justify-between text-sm md:text-base font-bold pt-2 border-t border-gray-200 mt-2">
          <span>Total</span>
          <span>{montantTotal} DT</span>
        </div>
      </div>

      {showCheckoutButton && (
        <Button
          onClick={onCommanderClick}
          disabled={panier.length === 0 || chargement}
          className="w-full mt-4 md:mt-6 py-2 md:py-3 px-4 rounded-none text-white text-xs md:text-sm font-medium border border-black hover:bg-white hover:text-black transition-colors"
          variant={panier.length === 0 || chargement ? "secondary" : "default"}
        >
          {chargement ? "Chargement..." : "Passer la commande"}
        </Button>
      )}
    </div>
  )
}

export default ResumeCommande