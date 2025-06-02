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
// Add these methods to your useUtilisateur hook
desactiverUtilisateur: async (id, raison, token) => {
  if (!id || get().loading) return;
  
  set({ loading: true });
  try {
    const res = await api.put(`/desactiverUtilisateur/${id}`, { raison }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to deactivate user');
    }
    
    toast.success(res.data.message || "Account deactivated successfully");
    
    // Update local state if needed
    if (get().utilisateur?.id === id) {
      set({ utilisateur: { ...get().utilisateur, est_actif: false } });
    }
    
    // Update in lists
    set({
      utilisateurs: get().utilisateurs.map(u => 
        u.id === id ? { ...u, est_actif: false } : u
      ),
      clients: get().clients.map(c => 
        c.utilisateur_id === id ? { ...c, utilisateur: { ...c.utilisateur, est_actif: false } } : c
      ),
      livreurs: get().livreurs.map(l => 
        l.utilisateur_id === id ? { ...l, utilisateur: { ...l.utilisateur, est_actif: false } } : l
      )
    });
    
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || 
                   error.message || 
                   'Failed to deactivate account';
    toast.error(message);
    throw error;
  } finally {
    set({ loading: false });
  }
},

reactiverUtilisateur: async (id, token) => {
  if (!id || get().loading) return;
  
  set({ loading: true });
  try {
    const res = await api.put(`/reactiverUtilisateur/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to reactivate user');
    }
    
    toast.success(res.data.message || "Account reactivated successfully");
    
    // Update local state if needed
    if (get().utilisateur?.id === id) {
      set({ utilisateur: { ...get().utilisateur, est_actif: true } });
    }
    
    // Update in lists
    set({
      utilisateurs: get().utilisateurs.map(u => 
        u.id === id ? { ...u, est_actif: true } : u
      ),
      clients: get().clients.map(c => 
        c.utilisateur_id === id ? { ...c, utilisateur: { ...c.utilisateur, est_actif: true } } : c
      ),
      livreurs: get().livreurs.map(l => 
        l.utilisateur_id === id ? { ...l, utilisateur: { ...l.utilisateur, est_actif: true } } : l
      )
    });
    
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || 
                   error.message || 
                   'Failed to reactivate account';
    toast.error(message);
    throw error;
  } finally {
    set({ loading: false });
  }
},
  activerLivreur: async (id, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/reactiverUtilisateur/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to activate delivery person');
      }
      
      toast.success(res.data.message || "Delivery person activated successfully");
      
      // Update local state
      set({
        livreurs: get().livreurs.map(livreur => 
          livreur.utilisateur_id === id 
            ? { ...livreur, statut: 'actif', utilisateur: { ...livreur.utilisateur, est_actif: true } } 
            : livreur
        ),
        livreur: get().livreur?.utilisateur_id === id 
          ? { ...get().livreur, statut: 'actif', utilisateur: { ...get().livreur.utilisateur, est_actif: true } }
          : get().livreur
      });
      
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to activate delivery person';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Deactivate livreur account
  desactiverLivreur: async (id, raison, token) => {
    if (!id || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/desactiverUtilisateur/${id}`, { raison }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to deactivate delivery person');
      }
      
      toast.success(res.data.message || "Delivery person deactivated successfully");
      
      // Update local state
      set({
        livreurs: get().livreurs.map(livreur => 
          livreur.utilisateur_id === id 
            ? { ...livreur, statut: 'inactif', utilisateur: { ...livreur.utilisateur, est_actif: false } } 
            : livreur
        ),
        livreur: get().livreur?.utilisateur_id === id 
          ? { ...get().livreur, statut: 'inactif', utilisateur: { ...get().livreur.utilisateur, est_actif: false } }
          : get().livreur
      });
      
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to deactivate delivery person';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  clearError: () => set({ error: null })
}))