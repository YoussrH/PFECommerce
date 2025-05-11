'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePanier } from '@/hooks/use-panier';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ResumeCommande from '@/app/components/caisse/CartSummary';

export default function LivraisonPage() {
  const router = useRouter();
  const { 
    sauvegarderMethodeLivraison, 
    chargement, 
    shippingMethod,
    initShipping
  } = usePanier();
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [addressVerified, setAddressVerified] = useState(false);

  useEffect(() => {
    initShipping();
    
    if (shippingMethod) {
      setSelectedMethod(shippingMethod);
    }

    const addressId = sessionStorage.getItem('current_address_id');
    if (!addressId) {
      toast.error('Veuillez d\'abord saisir une adresse de livraison');
      router.push('/caisse/adresse');
    } else {
      setAddressVerified(true);
    }
  }, [shippingMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error('Veuillez sélectionner un mode de livraison');
      return;
    }
    
    try {
      await sauvegarderMethodeLivraison(selectedMethod);
      router.push('/caisse/paiement');
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'enregistrement du mode de livraison");
    }
  };

  if (!addressVerified) {
    return <div className="max-w-2xl mx-auto p-4">Vérification de l&apos;adresse...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 py-8">
      <div className="w-full lg:flex-1 lg:max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-6">Mode de Livraison</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              {
                id: 'standard',
                name: 'Livraison standard',
                description: 'Livraison en 3-5 jours ouvrables',
                price: 7
              },
              {
                id: 'express',
                name: 'Livraison express',
                description: 'Livraison en 1-2 jours ouvrables',
                price: 15
              }
            ].map(method => (
              <div 
                key={method.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === method.id 
                    ? 'border-black bg-black/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      id={method.id}
                      name="shippingMethod"
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="mt-1"
                    />
                    <div>
                      <label htmlFor={method.id} className="font-medium block">
                        {method.name}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {method.price > 0 ? `${method.price} DT` : 'Gratuit'}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/caisse/adresse')}
                disabled={chargement}
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={!selectedMethod || chargement}
              >
                {chargement ? 'Enregistrement...' : 'Continuer vers le paiement'}
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
  );
}