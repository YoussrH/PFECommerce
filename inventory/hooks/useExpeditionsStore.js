'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: 'http://localhost:5000/expeditions',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useExpeditionsStore = create((set, get) => ({
  expeditions: [],
  colis: [],
  retours: [],
  loading: false,
  error: null,

  // Suivi des expéditions
  fetchExpeditions: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, livreur_id, date_debut, date_fin } = params;
      
      const res = await api.get('/expeditions', { 
        params: { page, limit, statut, livreur_id, date_debut, date_fin }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        expeditions: res.data.data?.expeditions || [],
        total: res.data.data?.total || 0
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch expeditions';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateExpeditionStatus: async ({ id, statut_expedition, notes }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/expeditions/${id}/statut`, { 
        statut_expedition, 
        notes 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update status');
      }
      
      toast.success(res.data.message || "Statut d'expédition mis à jour");
      await get().fetchExpeditions();
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update expedition status';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Gestion des colis
  fetchColis: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, commande_id } = params;
      
      const res = await api.get('/colis', { 
        params: { page, limit, statut, commande_id }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        colis: res.data.data?.colis || [],
        total: res.data.data?.total || 0
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch packages';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  manageColis: async ({ id, commande_id, poids, dimensions, contenu, livreur_id }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const method = id ? 'put' : 'post';
      const url = id ? `/colis/${id}` : '/colis';
      
      const res = await api[method](url, { 
        commande_id, 
        poids, 
        dimensions, 
        contenu, 
        livreur_id 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to manage package');
      }
      
      toast.success(res.data.message || "Colis géré avec succès");
      await get().fetchColis();
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to manage package';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Gestion des retours
  fetchRetours: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, type } = params;
      
      const res = await api.get('/retours', { 
        params: { page, limit, statut, type }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        retours: res.data.data?.retours || [],
        total: res.data.data?.total || 0
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch returns';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  processReturn: async ({ id, decision, motif_refus, notes }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/retours/${id}/traiter`, { 
        decision, 
        motif_refus, 
        notes 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to process return');
      }
      
      toast.success(res.data.message || "Retour traité avec succès");
      await get().fetchRetours();
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to process return';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));