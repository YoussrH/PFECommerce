// useCommandesStore.js
'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: 'http://localhost:5000/commandes',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useCommandesStore = create((set, get) => ({
  commandes: [],
  commande: null,
  total: 0,
  loading: false,
  error: null,

  getDeliveryInfo: (method) => ({
    fee: method === 'express' ? 15 : 7,
    description: method === 'express' 
      ? 'Livraison express (15 DT)' 
      : 'Livraison standard (7 DT)'
  }),

  fetchCommandes: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, search = '', statut = '' } = params;
      
      const res = await api.get('/', { 
        params: { page, limit, search, statut }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      const commandesWithDelivery = res.data.data?.commandes?.map(commande => ({
        ...commande,
        details_livraison: get().getDeliveryInfo(commande.methode_livraison)
      })) || [];
      
      set({ 
        commandes: commandesWithDelivery,
        total: res.data.data?.total || 0
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch orders';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchCommandeDetails: async (id) => {
    if (get().loading || (get().commande?.id === id)) return get().commande;
    
    set({ loading: true, error: null, commande: null });
    
    try {
      const res = await api.get(`/obtenirDetailsCommande/${id}`);
      
      if (!res.data || typeof res.data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to fetch order details');
      }
      
      let commandeData = res.data.data;
      if (!commandeData || typeof commandeData !== 'object' || !commandeData.id) {
        throw new Error('Invalid command data structure');
      }
      
      commandeData = {
        ...commandeData,
        details_livraison: get().getDeliveryInfo(commandeData.methode_livraison)
      };
      
      set({ commande: commandeData, error: null });
      return commandeData;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch order details';
      set({ error: message, commande: null });
      
      if (error.response?.status !== 404) {
        toast.error(message);
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateStatus: async (id, statut) => {
    if (!id || !statut || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/mettreAJourStatut/${id}/statut`, { statut });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update status');
      }
      
      toast.success(res.data.message || "Order status updated successfully");
      
      await Promise.all([
        get().fetchCommandes(),
        id === get().commande?.id && get().fetchCommandeDetails(id)
      ].filter(Boolean));
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update status';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  cancelCommande: async (id, raison, rembourser = false) => {
    if (!id || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.delete(`/annulerCommande/${id}`, { 
        data: { raison, rembourser } 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to cancel order');
      }
      
      toast.success(res.data.message || "Order cancelled successfully");
      
      await Promise.all([
        get().fetchCommandes(),
        id === get().commande?.id && get().fetchCommandeDetails(id)
      ].filter(Boolean));
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to cancel order';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  generateInvoice: async (id) => {
    if (!id || get().loading) return;
    
    set({ loading: true });
    try {
      const commande = get().commande || 
                     (await get().fetchCommandeDetails(id)) || 
                     get().commandes.find(c => c.id === id);
  
      if (commande?.statut === 'annulee') {
        toast.warning("Impossible de télécharger une facture pour une commande annulée");
        return;
      }
  
      const response = await api.get(`/genererFacture/${id}/facture`, {
        responseType: 'blob'
      });
  
      if (!response.data) {
        throw new Error('No PDF data received');
      }
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
  
      toast.success("Facture téléchargée avec succès");
      return true;
    } catch (error) {
      if (error.response?.status === 400) {
        toast.warning("Impossible de générer une facture pour cette commande");
      } else {
        const message = error.response?.data?.message || 
                       error.message || 
                       'Erreur lors de la génération de la facture';
        toast.error(message);
      }
      throw error;
    } finally {
      set({ loading: false });
    }
  },


}));