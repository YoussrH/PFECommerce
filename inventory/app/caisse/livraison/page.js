"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import ResumeCommande from "@/app/components/caisse/CartSummary"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function LivraisonPage() {
  const router = useRouter()
  const { sauvegarderMethodeLivraison, chargement, shippingMethod, initShipping } = usePanier()

  const [selectedMethod, setSelectedMethod] = useState("")
  const [addressVerified, setAddressVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        await initShipping()

        if (shippingMethod) {
          setSelectedMethod(shippingMethod)
        }

        const addressId = sessionStorage.getItem("current_address_id")
        if (!addressId) {
          toast.error("Veuillez d'abord saisir une adresse de livraison")
          router.push("/caisse/adresse")
        } else {
          setAddressVerified(true)
        }
      } catch (error) {
        console.error("Error initializing shipping:", error)
        toast.error("Erreur lors de l'initialisation des options de livraison")
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [shippingMethod, router, initShipping])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMethod) {
      toast.error("Veuillez sélectionner un mode de livraison")
      return
    }

    try {
      await sauvegarderMethodeLivraison(selectedMethod)
      router.push("/caisse/paiement")
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'enregistrement du mode de livraison")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">Chargement des options de livraison...</p>
        </div>
      </div>
    )
  }

  if (!addressVerified) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">Vérification de l&apos;adresse...</p>
        </div>
      </div>
    )
  }

  const shippingOptions = [
    {
      id: "standard",
      name: "Livraison standard",
      description: "Livraison en 3-5 jours ouvrables",
      price: 7,
    },
    {
      id: "express",
      name: "Livraison express",
      description: "Livraison en 1-2 jours ouvrables",
      price: 15,
    },
  ]

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 py-6 sm:py-8">
      <div className="w-full lg:flex-1 lg:max-w-2xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Mode de Livraison</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              {shippingOptions.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id ? "border-black bg-black/5" : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                      <div>
                        <Label htmlFor={method.id} className="font-medium block text-sm sm:text-base">
                          {method.name}
                        </Label>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </div>
                    <span className="font-medium text-sm sm:text-base">
                      {method.price > 0 ? `${method.price} DT` : "Gratuit"}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/caisse/adresse")}
                disabled={chargement}
              >
                Retour
              </Button>
              <Button type="submit" disabled={!selectedMethod || chargement}>
                {chargement ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Continuer vers le paiement"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-80">
        <ResumeCommande showPromoCode={false} showCheckoutButton={false} />
      </div>
    </div>
  )
}
