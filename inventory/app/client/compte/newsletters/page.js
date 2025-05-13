"use client";
import React, { useState } from "react";
import { toast } from "sonner";

export default function Newsletters() {
  const [preferences, setPreferences] = useState({
    general: true,
    promotions: false,
    newProducts: true,
    events: false,
  });

  const [email, setEmail] = useState("user@example.com"); // In a real app, get this from user context
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Préférences de newsletter mises à jour avec succès");
    }, 1000);
  };

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <h2 className="text-lg font-semibold mb-4">Gérer mes abonnements newsletter</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Email de contact</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:w-80 p-2 border border-gray-300 text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Nous utiliserons cette adresse pour vous envoyer nos newsletters.
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Préférences d&apos;abonnement</h3>
          
          <div className="space-y-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.general}
                onChange={(e) => setPreferences({...preferences, general: e.target.checked})}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Newsletter générale</p>
                <p className="text-xs text-gray-500">Recevez nos actualités et informations générales</p>
              </div>
            </label>
            
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.promotions}
                onChange={(e) => setPreferences({...preferences, promotions: e.target.checked})}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Offres et promotions</p>
                <p className="text-xs text-gray-500">Soyez informé de nos offres spéciales et réductions</p>
              </div>
            </label>
            
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.newProducts}
                onChange={(e) => setPreferences({...preferences, newProducts: e.target.checked})}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Nouveaux produits</p>
                <p className="text-xs text-gray-500">Découvrez nos nouveautés en avant-première</p>
              </div>
            </label>
            
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.events}
                onChange={(e) => setPreferences({...preferences, events: e.target.checked})}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Événements</p>
                <p className="text-xs text-gray-500">Invitations à nos événements exclusifs</p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? "Enregistrement..." : "Enregistrer mes préférences"}
          </button>
        </div>
      </form>
    </div>
  );
}
