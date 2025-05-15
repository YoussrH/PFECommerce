// components/caisse/CouponForm.js
import { useState } from 'react'
import { usePanier } from '@/hooks/use-panier'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const CouponForm = () => {
  const {
    codePromo,
    setCodePromo,
    appliquerCodePromo,
    remise,
    reinitialiserCoupon,
    chargement
  } = usePanier()

  const [applicationEnCours, setApplicationEnCours] = useState(false)

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
      }
    } finally {
      setApplicationEnCours(false)
    }
  }

  const handleSupprimerCoupon = () => {
    reinitialiserCoupon()
    toast.success("Coupon supprimé")
  }

  return (
    <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-100 mb-4">
      <h3 className="text-sm font-bold mb-3">APPLIQUER UN CODE PROMO</h3>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Entrez votre code promo"
          value={codePromo}
          onChange={(e) => setCodePromo(e.target.value)}
          disabled={applicationEnCours || chargement}
          className="flex-1"
        />
        <Button
          onClick={remise > 0 ? handleSupprimerCoupon : handleAppliquerCodePromo}
          disabled={applicationEnCours || (!codePromo.trim() && remise === 0) || chargement}
          className="px-4 py-2 bg-black text-white text-sm rounded-none hover:bg-white hover:text-black hover:border-black border border-black transition-colors"
          size="sm"
        >
          {applicationEnCours ? "..." : remise > 0 ? "Supprimer" : "Appliquer"}
        </Button>
      </div>
    </div>
  )
}