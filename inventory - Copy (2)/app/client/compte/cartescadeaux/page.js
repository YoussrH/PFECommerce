"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Gift, Plus, Copy, Check } from 'lucide-react';

export default function Mescartescadeau() {
  // Sample gift cards data - in a real app, this would come from an API
  const [giftCards, setGiftCards] = useState([
    {
      id: "GC-2023-001",
      code: "GIFT-1234-5678-90AB",
      balance: 50.00,
      expiryDate: "31/12/2023",
      isActive: true
    },
    {
      id: "GC-2023-002",
      code: "GIFT-2345-6789-01BC",
      balance: 25.50,
      expiryDate: "15/03/2024",
      isActive: true
    }
  ]);

  const [newCardCode, setNewCardCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const addGiftCard = async (e) => {
    e.preventDefault();
    if (!newCardCode.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Check if card already exists
      if (giftCards.some(card => card.code === newCardCode)) {
        toast.error("Cette carte cadeau est déjà associée à votre compte");
        setIsLoading(false);
        return;
      }
      
      // Add new card (in a real app, this would validate the code with the backend)
      const newCard = {
        id: `GC-2023-${Math.floor(1000 + Math.random() * 9000)}`,
        code: newCardCode,
        balance: Math.floor(Math.random() * 100) + 20,
        expiryDate: "31/12/2024",
        isActive: true
      };
      
      setGiftCards([...giftCards, newCard]);
      setNewCardCode("");
      setIsLoading(false);
      toast.success("Carte cadeau ajoutée avec succès");
    }, 1500);
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Mes cartes cadeau</h2>
        <p className="text-sm text-gray-600">
          Gérez vos cartes cadeau et consultez leur solde.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">Ajouter une carte cadeau</h3>
        
        <form onSubmit={addGiftCard} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Entrez le code de votre carte cadeau"
              value={newCardCode}
              onChange={(e) => setNewCardCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-sm text-sm"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? "Ajout en cours..." : "Ajouter"} 
            <Plus size={16} />
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-2">
          Le code de la carte cadeau se trouve au dos de votre carte physique ou dans l&apos;email que vous avez reçu.
        </p>
      </div>

      {giftCards.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-sm">
          <Gift size={40} className="mx-auto mb-3 text-gray-400" />
          <h3 className="text-md font-medium mb-2">Aucune carte cadeau</h3>
          <p className="text-sm text-gray-500">
            Vous n&apos;avez pas encore ajouté de carte cadeau à votre compte.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-md font-medium mb-2">Vos cartes cadeau</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {giftCards.map((card) => (
              <div 
                key={card.id} 
                className={`border rounded-sm p-4 ${card.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium">Carte #{card.id}</p>
                    <p className="text-xs text-gray-500">Expire le {card.expiryDate}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    card.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {card.isActive ? "Active" : "Expirée"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-grow">
                    <p className="text-xs text-gray-500">Code</p>
                    <p className="text-sm font-mono">{card.code}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(card.code, card.id)}
                    className="p-2 text-gray-500 hover:text-black"
                    aria-label="Copier le code"
                  >
                    {copiedId === card.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Solde disponible</p>
                  <p className="text-lg font-semibold">{card.balance.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Comment utiliser votre carte cadeau</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Ajoutez votre carte cadeau à votre compte.</li>
          <li>Lors du paiement, sélectionnez &quot;Utiliser une carte cadeau&quot;.</li>
          <li>Le montant sera automatiquement déduit de votre commande.</li>
          <li>Si le solde de votre carte est insuffisant, vous pourrez payer la différence par un autre moyen.</li>
        </ol>
      </div>
    </div>
  );
}
