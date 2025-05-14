"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from 'lucide-react';

export default function Mesretours() {
  // Sample returns data - in a real app, this would come from an API
  const [returns, setReturns] = useState([
    {
      id: "RET-2023-001",
      date: "15/04/2023",
      status: "Traité",
      items: [
        { name: "Chemise en lin", quantity: 1, reason: "Taille incorrecte" }
      ],
      refundAmount: 89.99,
      orderNumber: "ORD-2023-1234"
    },
    {
      id: "RET-2023-002",
      date: "02/06/2023",
      status: "En cours",
      items: [
        { name: "Pantalon chino", quantity: 1, reason: "Article défectueux" },
        { name: "Ceinture en cuir", quantity: 1, reason: "Ne correspond pas à la description" }
      ],
      refundAmount: 119.98,
      orderNumber: "ORD-2023-2345"
    }
  ]);

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
                <span className={`px-2 py-1 text-xs rounded-full ${
                  returnItem.status === "Traité" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
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
              
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Montant remboursé</p>
                  <p className="text-sm font-medium">{returnItem.refundAmount.toFixed(2)} €</p>
                </div>
                
                <Link 
                  href={`/client/compte/retours/${returnItem.id}`}
                  className="text-xs flex items-center gap-1 text-gray-700 hover:text-black"
                >
                  Détails <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium mb-3">Besoin d&apos;effectuer un retour ?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pour retourner un article, veuillez vous rendre dans la section &quot;Mes commandes&quot; et sélectionner la commande concernée.
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
