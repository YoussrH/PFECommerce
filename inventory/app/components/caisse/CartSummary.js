"use client"

import { useState, useEffect } from "react"
import { usePanier } from "@/hooks/use-panier"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ResumeCommande = ({ showPromoCode = true, showCheckoutButton = true, onCommanderClick }) => {
  const {
    panier,
    codePromo,
    setCodePromo,
    getTotal,
    getSubtotal,
    shippingCost,
    initShipping,
    appliquerCodePromo,
    chargement,
  } = usePanier()

  const [applicationEnCours, setApplicationEnCours] = useState(false)
  const [montantTotal, setMontantTotal] = useState("0.00")
  const [sousTotal, setSousTotal] = useState("0.00")
  const [fraisLivraison, setFraisLivraison] = useState("0.00")

  useEffect(() => {
    initShipping() // Initialize shipping data on mount
    const calculateTotals = () => {
      setSousTotal(getSubtotal())
      setFraisLivraison(shippingCost.toFixed(2))
      setMontantTotal(getTotal())
    }
    calculateTotals()
  }, [panier, shippingCost, getTotal, getSubtotal, initShipping])

  const handleAppliquerCodePromo = async () => {
    if (!codePromo.trim()) {
      toast.error("Veuillez entrer un code promo")
      return
    }

    setApplicationEnCours(true)
    try {
      const succes = await appliquerCodePromo(codePromo)
      if (succes) {
        toast.success("Code promo appliqué avec succès")
        setMontantTotal(getTotal())
      }
    } finally {
      setApplicationEnCours(false)
    }
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-sm shadow-sm border border-gray-100 h-fit sticky top-4">
      <h3 className="text-xs md:text-sm font-bold mb-3 md:mb-4">
        RÉSUMÉ DE LA COMMANDE ({panier.reduce((acc, item) => acc + item.quantite, 0)} articles)
      </h3>

      {showPromoCode && (
        <div className="mb-4 md:mb-6">
          <label htmlFor="promo-code" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            Code promo
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              id="promo-code"
              className="flex-1 min-w-0 p-2 border border-gray-300 rounded text-xs md:text-sm"
              placeholder="Entrez votre code"
              value={codePromo}
              onChange={(e) => setCodePromo(e.target.value)}
              disabled={applicationEnCours || chargement}
            />
            <Button
              onClick={handleAppliquerCodePromo}
              disabled={applicationEnCours || !codePromo.trim() || chargement}
              className="px-2 md:px-4 py-2 bg-black text-white text-xs md:text-sm rounded-none hover:bg-white hover:text-black hover:border-black border border-black transition-colors"
              size="sm"
            >
              {applicationEnCours ? "..." : "Appliquer"}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3 md:pt-4 space-y-2 md:space-y-3">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Sous-total</span>
          <span>{sousTotal} DT</span>
        </div>

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
