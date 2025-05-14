"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Search, Filter } from 'lucide-react';

export default function MesCommandes() {
  // Sample orders data - in a real app, this would come from an API
  const [orders, setOrders] = useState([
    {
      id: "ORD-2023-1234",
      date: "10/04/2023",
      status: "Livré",
      items: [
        { name: "Chemise en lin", quantity: 1, price: 89.99, image: "/placeholder.svg?height=60&width=60" },
        { name: "Cravate en soie", quantity: 1, price: 49.99, image: "/placeholder.svg?height=60&width=60" }
      ],
      total: 139.98,
      tracking: "1Z999AA10123456784"
    },
    {
      id: "ORD-2023-2345",
      date: "28/05/2023",
      status: "En cours de livraison",
      items: [
        { name: "Pantalon chino", quantity: 1, price: 79.99, image: "/placeholder.svg?height=60&width=60" },
        { name: "Ceinture en cuir", quantity: 1, price: 39.99, image: "/placeholder.svg?height=60&width=60" }
      ],
      total: 119.98,
      tracking: "1Z999AA10123456785"
    },
    {
      id: "ORD-2023-3456",
      date: "15/06/2023",
      status: "En préparation",
      items: [
        { name: "Veste en laine", quantity: 1, price: 199.99, image: "/placeholder.svg?height=60&width=60" }
      ],
      total: 199.99,
      tracking: null
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (orders.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Aucune commande</h2>
          <p className="text-gray-600 mb-6">Vous n&apos;avez pas encore passé de commande</p>
          <Link 
            href="/shop" 
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Découvrir nos produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Mes commandes</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm"
            />
          </div>
          
          <div className="relative w-full sm:w-48">
            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="En préparation">En préparation</option>
              <option value="En cours de livraison">En cours de livraison</option>
              <option value="Livré">Livré</option>
            </select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune commande ne correspond à votre recherche</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-sm overflow-hidden">
              <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <p className="text-sm font-medium">Commande #{order.id}</p>
                  <p className="text-xs text-gray-500">Passée le {order.date}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === "Livré" 
                      ? "bg-green-100 text-green-800" 
                      : order.status === "En cours de livraison"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {order.status}
                  </span>
                  <Link 
                    href={`/client/compte/commande/${order.id}`}
                    className="text-xs text-black hover:underline"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-4 mb-4">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qté: {item.quantity} · {item.price.toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                  
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-500">
                      + {order.items.length - 2} article(s) supplémentaire(s)
                    </p>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-medium">{order.total.toFixed(2)} €</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.tracking && (
                      <Link 
                        href={`/tracking?number=${order.tracking}`}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-sm hover:bg-gray-50"
                      >
                        Suivre
                      </Link>
                    )}
                    
                    <Link 
                      href={`/client/compte/commande/${order.id}`}
                      className="text-xs px-3 py-1.5 bg-black text-white rounded-sm hover:bg-gray-800"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
