// hooks/useClient.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

export const useClient = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create axios instance with base URL and auth headers
  const api = axios.create({
    baseURL: 'http://localhost:5000/clients',
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });

  // Handle API errors consistently
  const handleError = (error, defaultMessage = 'Une erreur est survenue') => {
    const errorMessage = error.response?.data?.message || error.message || defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  };

  /**
   * Update client profile
   */
const updateProfile = async (profileData) => {
  if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
  
  try {
    setLoading(true);
    setError(null);
    
    const response = await api.put('/mettreAJourProfil', profileData);
    
    if (response.data.success) {
      toast.success('Profil mis à jour avec succès');
      return { success: true, data: response.data.data };
    }
    
    throw new Error(response.data.message || 'Échec de la mise à jour du profil');
  } catch (error) {
    return handleError(error, 'Échec de la mise à jour du profil');
  } finally {
    setLoading(false);
  }
};

  const getOrders = useCallback(async (page = 1, limit = 10, filters = {}) => {
    if (!isAuthenticated) return { success: false, error: 'Unauthorized' };
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        ...filters
      };

      const response = await api.get('/obtenirCommandesClient', { params });
      
      if (response.data.success) {
        // Ensure each item has a proper image URL
        const ordersWithImages = response.data.data.orders?.map(order => ({
          ...order,
          items: order.items?.map(item => ({
            ...item,
            image: item.image?.startsWith('http') ? item.image : 
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}${item.image}`,
          })) || []
        })) || [];
        
        return { 
          success: true, 
          data: {
            orders: ordersWithImages,
            ...response.data.data
          },
          pagination: response.data.data.pagination 
        };
      }
      
      throw new Error(response.data.message || 'Failed to fetch orders');
    } catch (error) {
      return handleError(error, 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  /**
   * Filter orders by status
   */
  const filterOrdersByStatus = async (status) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      // Map frontend status to backend enum values
      const backendStatus = {
        'En préparation': 'en_preparation',
        'Expédié': 'expediee',
        'Livré': 'livree',
        'Retourné': 'retourne',
        'Annulé': 'annulee'
      }[status] || status;
      
      const response = await api.get('/filtrerCommandesParStatut', { 
        params: { statut: backendStatus } 
      });
      
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data || []
        };
      }
      
      throw new Error(response.data.message || 'Échec du filtrage des commandes');
    } catch (error) {
      return handleError(error, 'Échec du filtrage des commandes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter orders by date range
   */
  const filterOrdersByDate = async (startDate, endDate, dateType = 'expedition') => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/filtrerCommandesParDate', { 
        params: { 
          date_debut: startDate.toISOString(),
          date_fin: endDate.toISOString(),
          date_type: dateType
        } 
      });
      
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data || []
        };
      }
      
      throw new Error(response.data.message || 'Échec du filtrage des commandes');
    } catch (error) {
      return handleError(error, 'Échec du filtrage des commandes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get order details
   */
  const getOrderDetails = async (orderId) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/obtenirDetailsCommandeClient/${orderId}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la récupération des détails de la commande');
    } catch (error) {
      return handleError(error, 'Échec de la récupération des détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get client returns
   */
  const getReturns = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/obtenirRetoursClient', { params: { page, limit } });
      
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data,
          pagination: response.data.data.pagination 
        };
      }
      
      throw new Error(response.data.message || 'Échec de la récupération des retours');
    } catch (error) {
      return handleError(error, 'Échec de la récupération des retours');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  /**
   * Get client replacements
   */
  const getReplacements = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/obtenirRemplacementsClient', { params: { page, limit } });
      
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data,
          pagination: response.data.data.pagination 
        };
      }
      
      throw new Error(response.data.message || 'Échec de la récupération des remplacements');
    } catch (error) {
      return handleError(error, 'Échec de la récupération des remplacements');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  /**
   * Request a return
   */
  const requestReturn = async (orderId, items, reason) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/demanderRetour', { 
        orderId, 
        items, 
        reason 
      });
      
      if (response.data.success) {
        toast.success('Demande de retour envoyée avec succès');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la demande de retour');
    } catch (error) {
      return handleError(error, 'Échec de la demande de retour');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request a replacement
   */
  const requestReplacement = async (orderId, items, reason) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/demanderRemplacement', { 
        orderId, 
        items, 
        reason 
      });
      
      if (response.data.success) {
        toast.success('Demande de remplacement envoyée avec succès');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la demande de remplacement');
    } catch (error) {
      return handleError(error, 'Échec de la demande de remplacement');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update newsletter subscription
   */
  const updateNewsletterSubscription = async (subscribed) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/mettreAJourNewsletter', { subscribed });
      
      if (response.data.success) {
        toast.success('Préférences newsletter mises à jour');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la mise à jour des préférences newsletter');
    } catch (error) {
      return handleError(error, 'Échec de la mise à jour des préférences newsletter');
    } finally {
      setLoading(false);
    }
  };


    const markAddressAsPrimary = async (addressId) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/marquerAdressePrincipale/${addressId}`);
      
      if (response.data.success) {
        toast.success('Adresse principale mise à jour');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la mise à jour de l\'adresse principale');
    } catch (error) {
      return handleError(error, 'Échec de la mise à jour de l\'adresse principale');
    } finally {
      setLoading(false);
    }
  };

  
  const getAddresses = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/obtenirAdresses', { 
        params: { page, limit } 
      });
      
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data,
          pagination: response.data.data.pagination 
        };
      }
      
      throw new Error(response.data.message || 'Échec de la récupération des adresses');
    } catch (error) {
      return handleError(error, 'Échec de la récupération des adresses');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, api]);

  /**
   * Update an address
   */
  const updateAddress = async (addressId, addressData) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/mettreAJourAdresse/${addressId}`, addressData);
      
      if (response.data.success) {
        toast.success('Adresse mise à jour avec succès');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la mise à jour de l\'adresse');
    } catch (error) {
      return handleError(error, 'Échec de la mise à jour de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an address
   */
  const deleteAddress = async (addressId) => {
    if (!isAuthenticated) return { success: false, error: 'Non authentifié' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/supprimerAdresse/${addressId}`);
      
      if (response.data.success) {
        toast.success('Adresse supprimée avec succès');
        return { success: true, data: response.data.data };
      }
      
      throw new Error(response.data.message || 'Échec de la suppression de l\'adresse');
    } catch (error) {
      return handleError(error, 'Échec de la suppression de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  // Update the return statement to include the new methods
  return {
    loading,
    error,
    updateProfile,
    getOrders,
    filterOrdersByStatus,
    filterOrdersByDate,
    getOrderDetails,
    getReturns,
    getReplacements,
    requestReturn,
    requestReplacement,
    updateNewsletterSubscription,
    getAddresses,
    markAddressAsPrimary,
    updateAddress,
    deleteAddress,

  };
}