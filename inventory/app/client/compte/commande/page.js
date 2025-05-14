"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Search, Filter } from 'lucide-react';
import { useClient } from '@/hooks/useClient';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

// Helper function to ensure valid image URLs
const getValidImageUrl = (url) => {
  if (!url || url === '/placeholder.svg') return '/placeholder.svg';
  
  try {
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a path, prepend the base URL
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${url}`;
  } catch (e) {
    return '/placeholder.svg';
  }
};

export default function MesCommandes() {
  const { isAuthenticated } = useAuth();
  const { getOrders, loading, error } = useClient();
  const [orders, setOrders] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    console.log("Changement dans les dépendances useEffect", {
      page: pagination.page,
      filterStatus,
      isAuthenticated
    });
    
    if (isAuthenticated) {
      console.log("Utilisateur authentifié, récupération des commandes");
      fetchOrders();
    } else {
      console.warn("Utilisateur non authentifié");
    }
  }, [pagination.page, filterStatus, isAuthenticated]);

  const fetchOrders = async () => {
    const filters = {};
    if (filterStatus !== "all") {
      filters.status = filterStatus;
    }
    
    console.log("Préparation de la requête avec filtres:", filters);

    try {
      const { success, data, pagination: paginationData, error: apiError } = await getOrders(
        pagination.page,
        pagination.limit,
        filters
      );
      
      if (success) {
        console.log("Réponse API réussie:", {
          orders: data.orders,
          pagination: paginationData
        });

        // Validate and sanitize order data
        const validatedOrders = data.orders.map(order => ({
          ...order,
          items: order.items.map(item => ({
            ...item,
            image: getValidImageUrl(item.image)
          }))
        }));

        setOrders(validatedOrders);
        setPagination(prev => ({
          ...prev,
          total: paginationData.total
        }));

      } else {
        console.error("Erreur API:", apiError);
        toast.error("Échec du chargement des commandes");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération:", {
        error: error.message,
        stack: error.stack
      });
      toast.error("Échec du chargement des commandes");
      setOrders([]);
    }
  };

  const handlePageChange = (newPage) => {
    console.log("Changement de page:", newPage);
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const filteredOrders = orders.filter(order => {
    const orderId = order?.id || '';
    const orderItems = order?.items || [];
    
    const matchesSearch = orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
                         orderItems.some(item => 
                           item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    return matchesSearch;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center border border-gray-200 rounded-sm">
        <div className="flex flex-col items-center justify-center py-8 md:py-12">
          <Package size={48} className="mb-4 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0 && !loading) {
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
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_preparation">En préparation</option>
              <option value="expediee">Expédiée</option>
              <option value="livree">Livrée</option>
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
                  <p className="text-xs text-gray-500">
                    Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === "livree" 
                      ? "bg-green-100 text-green-800" 
                      : order.status === "expediee"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {order.status === "en_preparation" && "En préparation"}
                    {order.status === "expediee" && "Expédiée"}
                    {order.status === "livree" && "Livrée"}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-4 mb-4">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={`${order.id}-${item.id}-${index}`} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 50px) 100vw, 50px"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qté: {item.quantity} · {item.price.toFixed(2)} DT</p>
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
                    <p className="text-sm font-medium">{order.total.toFixed(2)} DT</p>
                  </div>
                  
                  <Link 
                    href={`/client/compte/commande/${order.id}`}
                    className="text-xs px-3 py-1.5 bg-black text-white rounded-sm hover:bg-gray-800"
                  >
                    Voir plus
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-sm disabled:opacity-50"
            >
              Précédent
            </button>
            
            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
              .slice(
                Math.max(0, pagination.page - 3),
                Math.min(Math.ceil(pagination.total / pagination.limit), pagination.page + 2)
              )
              .map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded-sm ${
                    page === pagination.page 
                      ? 'bg-black text-white border-black' 
                      : 'border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="px-3 py-1 border border-gray-300 rounded-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}