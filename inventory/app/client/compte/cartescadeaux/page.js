"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Gift, Search, Copy, Check } from 'lucide-react';
import { useClient } from "@/hooks/useClient";

export default function Mescartescadeau() {
  const { getCoupons, loading, error } = useClient();
  const [coupons, setCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getCoupons(1, 10);
      if (result.success) {
        setCoupons(result.data.coupons);
      }
    };
    fetchData();
  }, []); 

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Code copié dans le presse-papier");
  };

  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  const getCouponStatus = (coupon) => {
    if (coupon.is_used) {
      return { status: 'Utilisé', color: 'bg-blue-100 text-blue-800' };
    }
    
    const now = new Date();
    const expiryDate = new Date(coupon.expires_at);
    if (now > expiryDate) {
      return { status: 'Expiré', color: 'bg-red-100 text-red-800' };
    }
    
    return { status: 'Valide', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Mes cartes cadeau</h2>
        <p className="text-sm text-gray-600">
          Gérez vos cartes cadeau et coupons de réduction.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">Rechercher un coupon</h3>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par code ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 border border-gray-300 rounded-sm text-sm"
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Entrez le code ou l&apos;ID de votre coupon pour le retrouver rapidement.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Chargement de vos coupons...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>Erreur lors du chargement des coupons: {error}</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-sm">
          <Gift size={40} className="mx-auto mb-3 text-gray-400" />
          <h3 className="text-md font-medium mb-2">
            {searchTerm ? "Aucun coupon ne correspond à votre recherche" : "Aucun coupon disponible"}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm 
              ? "Essayez avec un autre terme de recherche" 
              : "Vous n'avez pas encore de coupon associé à votre compte."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">Vos coupons</h3>
            <p className="text-sm text-gray-500">
              {filteredCoupons.length} {filteredCoupons.length > 1 ? 'coupons' : 'coupon'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCoupons.map((coupon) => {
              const { status, color } = getCouponStatus(coupon);
              
              return (
                <div 
                  key={coupon.id} 
                  className={`border rounded-sm p-4 ${status === 'Valide' ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium">Coupon #{coupon.id.split('-')[0]}</p>
                      <p className="text-xs text-gray-500">Expire le {formatDate(coupon.expires_at)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-grow">
                      <p className="text-xs text-gray-500">Code</p>
                      <p className="text-sm font-mono">{coupon.code}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(coupon.code, coupon.id)}
                      className="p-2 text-gray-500 hover:text-black"
                      aria-label="Copier le code"
                    >
                      {copiedId === coupon.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Valeur</p>
                    <p className="text-lg font-semibold">
                      {coupon.type === 'percentage' 
                        ? `${coupon.value}% de réduction` 
                        : `${parseFloat(coupon.value).toFixed(2)}DT de réduction`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-8 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Comment utiliser vos coupons</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Lors du paiement, sélectionnez &quot;Utiliser un coupon&quot;.</li>
          <li>Entrez le code de votre coupon ou sélectionnez-le dans votre compte.</li>
          <li>La réduction sera automatiquement appliquée à votre commande.</li>
          <li>Certains coupons peuvent avoir des restrictions (produits spécifiques, montant minimum, etc.).</li>
        </ol>
      </div>
    </div>
  );
}