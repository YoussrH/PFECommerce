// app/caisse/paiement/page.js
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import ResumeCommande from "@/app/components/caisse/CartSummary"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CouponForm } from "@/app/components/caisse/CouponForm"

const paymentMethods = [
  {
    id: "livraison",
    name: "Paiement à la livraison",
    available: true,
  },
  {
    id: "carte",
    name: "Carte de crédit",
    available: false,
    comingSoonText: "Bientôt disponible",
  },
  {
    id: "paypal",
    name: "Post Tunisien",
    available: false,
    comingSoonText: "Bientôt disponible",
  },
]

export default function PaiementPage() {
  const router = useRouter()
  const { 
    traiterPaiement, 
    panier, 
    recupererPanier, 
    initShipping, 
    shippingMethod, 
    shippingCost,
    panierId,
    codePromo,
    remise
  } = usePanier()

  const [selectedMethod, setSelectedMethod] = useState("livraison")
  const [processing, setProcessing] = useState(false)
  const [addressId, setAddressId] = useState(null)
  const [checkoutReady, setCheckoutReady] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeCheckout = async () => {
      try {
        initShipping()

        const storedAddressId = sessionStorage.getItem("current_address_id")
        if (!storedAddressId) {
          toast.error("Veuillez sélectionner une adresse de livraison")
          router.push("/caisse/adresse")
          return
        }

        if (!shippingMethod) {
          toast.error("Veuillez sélectionner un mode de livraison")
          router.push("/caisse/livraison")
          return
        }

        await recupererPanier()
        
        if (!isMounted) return

        setAddressId(storedAddressId)
        setCheckoutReady(true)
      } catch (error) {
        if (!isMounted) return
        console.error("Erreur d'initialisation:", error)
        toast.error("Erreur lors de la préparation de la commande")
      } finally {
        if (isMounted) setInitialLoad(false)
      }
    }

    initializeCheckout()

    return () => {
      isMounted = false
    }
  }, [router, recupererPanier, initShipping, shippingMethod, panier.length, panierId])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMethod || !addressId) {
      toast.error("Configuration de commande incomplète")
      return
    }

    setProcessing(true)
    try {
      const result = await traiterPaiement(selectedMethod, addressId, remise > 0 ? codePromo : null)

      if (result?.success) {
        router.push(result.etapeSuivante)
      } else {
        throw new Error(result?.message || "Échec du traitement du paiement")
      }
    } catch (error) {
      console.error("Erreur de paiement:", error)
      
      if (error.message.includes("panier")) {
        router.push("/panier")
      } else if (error.message.includes("adresse")) {
        router.push("/caisse/adresse")
      } else if (error.message.includes("stock")) {
        await recupererPanier()
        toast.error("Certains articles ne sont plus disponibles")
      } else {
        toast.error(error.message || "Échec du paiement")
      }
    } finally {
      setProcessing(false)
    }
  }

  const handlePrevious = () => {
    router.push("/caisse/livraison")
  }

  if (initialLoad) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">Préparation de votre commande...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 py-6 sm:py-8">
      <div className="w-full lg:flex-1 lg:max-w-2xl mx-auto">
        <CouponForm />
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Méthode de Paiement</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RadioGroup 
              value={selectedMethod} 
              onValueChange={setSelectedMethod}
              className="space-y-3"
            >
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`relative border rounded p-3 sm:p-4 transition-colors ${
                    !method.available ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"
                  } ${selectedMethod === method.id ? "border-black bg-black/5" : "border-gray-300"}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      disabled={!method.available}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Label
                      htmlFor={method.id}
                      className="cursor-pointer text-sm sm:text-base disabled:cursor-not-allowed"
                    >
                      {method.name}
                    </Label>
                  </div>

                  {!method.available && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10 rounded">
                      <span className="bg-black text-white text-xs px-2 py-1 rounded">
                        {method.comingSoonText}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={processing}
              >
                Retour
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedMethod || processing || !checkoutReady}
                className="min-w-[180px]"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  "Confirmer la commande"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-80">
        <ResumeCommande showCheckoutButton={false} />
      </div>
    </div>
  )
}