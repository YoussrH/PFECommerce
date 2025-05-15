"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Package } from 'lucide-react';
import { useClient } from '@/hooks/useClient';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

export default function Mesretours() {
  const { isAuthenticated } = useAuth();
  const { getReturns, loading, error } = useClient();
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReturns();
    }
  }, [isAuthenticated]);

  const fetchReturns = async () => {
    const { success, data } = await getReturns();
    if (success && data?.retours) {
      try {
        // Safely transform the API data
        const formattedReturns = data.retours.map(retour => ({
          id: retour.id || 'N/A',
          date: retour.created_at 
            ? new Date(retour.created_at).toLocaleDateString('fr-FR') 
            : 'Date inconnue',
          status: getStatusText(retour.statut),
          items: (retour.articles || []).map(article => ({
            name: article.nom_produit || 'Article inconnu',
            quantity: article.quantite || 1,
            reason: article.raison || retour.motif || 'Non spécifié'
          })),
          refundAmount: retour.montant_remboursement || 0,
          orderNumber: retour.commande?.reference || 'N/A'
        }));
        setReturns(formattedReturns);
      } catch (err) {
        console.error('Error formatting returns:', err);
        toast.error('Erreur de format des données de retour');
      }
    } else {
      toast.error(error || 'Erreur lors du chargement des retours');
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'traite': return 'Traité';
      case 'en_attente': return 'En attente';
      case 'refuse': return 'Refusé';
      case 'annule': return 'Annulé';
      default: return 'En cours';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Traité': return 'bg-green-100 text-green-800';
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      case 'Annulé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Connectez-vous</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour voir vos retours</p>
          <Link 
            href="/connexion" 
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (loading && returns.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Chargement de vos retours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchReturns}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Aucun retour</h2>
          <p className="text-gray-600 mb-6">Vous n&apos;avez effectué aucun retour pour le moment</p>
          <Link 
            href="/client/compte/commande" 
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Voir mes commandes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Mes retours</h2>
        <p className="text-gray-600 text-sm">{returns.length} retour(s)</p>
      </div>

      <div className="space-y-6">
        {returns.map((returnItem) => (
          <div key={returnItem.id} className="border border-gray-200 rounded-sm overflow-hidden">
            <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm font-medium">Retour #{returnItem.id}</p>
                <p className="text-xs text-gray-500">Commande #{returnItem.orderNumber}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-xs">Date: {returnItem.date}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(returnItem.status)}`}>
                  {returnItem.status}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-sm font-medium mb-2">Articles retournés</h3>
              <ul className="space-y-2 mb-4">
                {returnItem.items.map((item, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-500">{item.reason}</span>
                  </li>
                ))}
              </ul>
              
              {returnItem.refundAmount > 0 && (
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Montant remboursé</p>
                    <p className="text-sm font-medium">
                      {returnItem.refundAmount.toFixed(2)} DT
                    </p>
                  </div>

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Besoin d&apos;effectuer un retour ?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pour retourner un article, veuillez vous rendre dans la section &quot;Servicec Client &quot; et Nous contacter sur la  commande concernée.
        </p>
        <Link 
          href="/client/compte/commande" 
          className="text-sm text-black hover:underline flex items-center gap-1"
        >
          Aller à mes commandes <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}