'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePanier } from '@/hooks/use-panier'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ResumeCommande from '@/app/components/caisse/CartSummary'

const paymentMethods = [
  { 
    id: 'livraison', 
    name: 'Paiement à la livraison',
    available: true
  },
  { 
    id: 'carte', 
    name: 'Carte de crédit',
    available: false,
    comingSoonText: 'Bientôt disponible' 
  },
  { 
    id: 'paypal', 
    name: 'PayPal',
    available: false,
    comingSoonText: 'Bientôt disponible'
  }
]

export default function PaiementPage() {
  const router = useRouter()
  const { 
    traiterPaiement, 
    panier, 
    recupererPanier, 
    initShipping,
    shippingMethod,
    shippingCost
  } = usePanier()
  
  const [selectedMethod, setSelectedMethod] = useState('livraison')
  const [processing, setProcessing] = useState(false)
  const [addressId, setAddressId] = useState(null)
  const [checkoutReady, setCheckoutReady] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})
  const [initialLoad, setInitialLoad] = useState(true)

  // Initialize checkout data
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Initialize shipping data
        initShipping()
        
        // Verify required checkout data exists
        const storedAddressId = sessionStorage.getItem('current_address_id')
        if (!storedAddressId) {
          toast.error('Veuillez sélectionner une adresse de livraison')
          router.push('/caisse/adresse')
          return
        }

        // Verify shipping method is selected
        if (!shippingMethod) {
          toast.error('Veuillez sélectionner un mode de livraison')
          router.push('/caisse/livraison')
          return
        }

        // Ensure cart has items
        if (panier.length === 0) {
          await recupererPanier()
          if (panier.length === 0) {
            toast.error('Votre panier est vide')
            return
          }
        }

        setAddressId(storedAddressId)
        setCheckoutReady(true)
        
        // Set debug info
        setDebugInfo({
          cartItemCount: panier.length,
          addressId: storedAddressId,
          shippingMethod,
          shippingCost
        })
        
      } catch (error) {
        console.error('Checkout initialization error:', error)
        toast.error('Erreur lors de la préparation de la commande')
      } finally {
        setInitialLoad(false)
      }
    }

    initializeCheckout()
  }, [panier.length, router, recupererPanier, initShipping, shippingMethod])

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMethod || !addressId) {
      toast.error('Configuration de commande incomplète');
      return;
    }
    
    setProcessing(true);
    try {
      const result = await traiterPaiement(selectedMethod, addressId);
      
      if (result?.success) {
        // Clear session storage
        sessionStorage.removeItem('current_address_id');
        sessionStorage.removeItem('shipping_method');
        sessionStorage.removeItem('shipping_cost');
        
        // Redirect to confirmation
        router.push(result.etapeSuivante);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Handle specific error cases
      if (error.message.includes('panier')) {
        router.push('/panier');
      } else if (error.message.includes('adresse')) {
        router.push('/caisse/adresse');
      } else if (error.message.includes('stock')) {
        toast.error('Certains articles ne sont plus disponibles en quantité suffisante');
        await recupererPanier();
      } else {
        toast.error(error.message || 'Échec du paiement');
      }
    } finally {
      setProcessing(false);
    }
  }

  const handlePrevious = () => {
    router.push('/caisse/livraison')
  }

  // Loading state
  if (initialLoad) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p>Préparation de votre commande...</p>
      </div>
    )
  }

  // Empty cart state
  if (panier.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Votre panier est vide</h1>
        <Button onClick={() => router.push('/store/nouveautes')}>
          Retour à la boutique
        </Button>
      </div>
    )
  }

  // Main checkout form
  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 py-8">
      <div className="w-full lg:flex-1 lg:max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-6">Méthode de Paiement</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {paymentMethods.map(method => (
              <div 
                key={method.id} 
                className={`flex items-center gap-4 p-4 border rounded relative ${
                  !method.available ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  selectedMethod === method.id ? 'border-black bg-black/5' : 'border-gray-300'
                }`}
                onClick={() => method.available && setSelectedMethod(method.id)}
              >
                <input
                  type="radio"
                  id={method.id}
                  checked={selectedMethod === method.id}
                  onChange={() => {}}
                  disabled={!method.available}
                  className="cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor={method.id} className="cursor-pointer">
                  {method.name}
                </label>
                
                {!method.available && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
                    <span className="bg-black text-white text-xs px-2 py-1 rounded">
                      {method.comingSoonText}
                    </span>
                  </div>
                )}
              </div>
            ))}

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
              >
                {processing ? 'Traitement...' : 'Confirmer la commande'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-80">
        <ResumeCommande 
          showPromoCode={false}
          showCheckoutButton={false}
        />
      </div>
    </div>
  )
}