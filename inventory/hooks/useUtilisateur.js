'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: 'http://localhost:5000/utilisateurs',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useUtilisateur = create((set, get) => ({
  utilisateurs: [],
  livreurs: [],
  clients: [],
  utilisateur: null,
  livreur: null,
  client: null,
  total: 0,
  loading: false,
  error: null,

  // Get all users with pagination and filtering
  obtenirTousUtilisateurs: async (params = {}, token) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get('/obtenirTousUtilisateurs', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        utilisateurs: res.data.data || [],
        total: res.data.pagination?.total || 0
      });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { page: 1, total: 0, totalPages: 1 }
      };
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch users';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get user by ID
  obtenirUtilisateurParId: async (id, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true, error: null, utilisateur: null });
    try {
      const res = await api.get(`/obtenirUtilisateurParId/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to fetch user');
      }
      
      set({ utilisateur: res.data.data, error: null });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch user';
      set({ error: message, utilisateur: null });
      
      if (error.response?.status !== 404) {
        toast.error(message);
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update user
  mettreAJourUtilisateur: async (id, updates, token) => {
    if (!id || !updates || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/mettreAJourUtilisateur/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update user');
      }
      
      toast.success(res.data.message || "User updated successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update user';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Create delivery person (Livreur)
  creeLivreur: async (livreurData, token) => {
    if (!livreurData || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.post('/creeLivreur', livreurData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to create delivery person');
      }
      
      toast.success(res.data.message || "Delivery person created successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to create delivery person';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get all delivery persons (Livreurs)
  obtenirTousLivreurs: async (params = {}, token) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get('/obtenirTousLivreurs', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        livreurs: res.data.data || [],
        total: res.data.pagination?.total || 0
      });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { page: 1, total: 0, totalPages: 1 }
      };
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch delivery persons';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get delivery person by ID
  obtenirLivreurParId: async (id, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true, error: null, livreur: null });
    try {
      const res = await api.get(`/obtenirLivreurParId/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to fetch delivery person');
      }
      
      set({ livreur: res.data.data, error: null });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch delivery person';
      set({ error: message, livreur: null });
      
      if (error.response?.status !== 404) {
        toast.error(message);
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update delivery person
  mettreAJourLivreur: async (id, updates, token) => {
    if (!id || !updates || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/mettreAJourLivreur/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update delivery person');
      }
      
      toast.success(res.data.message || "Delivery person updated successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update delivery person';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Delete delivery person
  supprimerLivreur: async (id, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.delete(`/supprimerLivreur/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to delete delivery person');
      }
      
      toast.success(res.data.message || "Delivery person deleted successfully");
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to delete delivery person';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get all clients
  obtenirTousClients: async (params = {}, token) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get('/obtenirTousClients', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        clients: res.data.data || [],
        total: res.data.pagination?.total || 0
      });
      return {
        data: res.data.data || [],
        pagination: res.data.pagination || { page: 1, total: 0, totalPages: 1 }
      };
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch clients';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get client by ID
  obtenirClientParId: async (id, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true, error: null, client: null });
    try {
      const res = await api.get(`/obtenirClientParId/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to fetch client');
      }
      
      set({ client: res.data.data, error: null });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch client';
      set({ error: message, client: null });
      
      if (error.response?.status !== 404) {
        toast.error(message);
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update client
  mettreAJourClient: async (id, updates, token) => {
    if (!id || !updates || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/mettreAJourClient/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update client');
      }
      
      toast.success(res.data.message || "Client updated successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update client';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get available delivery persons
  obtenirLivreursDisponibles: async (token) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get('/livreurs-disponibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      return res.data.data || [];
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch available delivery persons';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null })
}))