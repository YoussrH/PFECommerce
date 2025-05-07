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

  // Helper to map package status to display text
  mapColisStatus: (status) => {
    switch(status) {
      case 'preparation': return 'Préparée';
      case 'expediee': return 'En route';
      case 'livre': return 'Livrée';
      case 'retourne': return 'Retourné';
      case 'echec': return 'Échec de livraison';
      default: return status;
    }
  },

  // Fetch packages with QR code data
  fetchColis: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, commande_id } = params;
      
      const res = await api.get('/colis', { 
        params: { 
          page, 
          limit, 
          statut: statut === 'Préparée' ? 'preparation' :
                 statut === 'En route' ? 'expediee' :
                 statut === 'Livrée' ? 'livre' :
                 statut === 'Retourné' ? 'retourne' :
                 statut === 'Échec de livraison' ? 'echec' : statut,
          commande_id 
        }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      // Transform data to include mapped status and ensure QR code data is included
      const colis = res.data.data?.colis?.map(colis => ({
        ...colis,
        display_status: get().mapColisStatus(colis.statut),
        qr_code_data: colis.qr_code_data || null,
        commande_reference: colis.commande?.reference || 'N/A',
        client_nom: colis.commande?.client?.utilisateur?.nom || 'N/A',
        client_prenom: colis.commande?.client?.utilisateur?.prenom || 'N/A'
      })) || [];
      
      set({ 
        colis,
        total: res.data.data?.total || 0,
        pages: res.data.data?.pages || 1
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

  // Fetch expeditions (now based on Colis)
  fetchExpeditions: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, livreur_id, date_debut, date_fin } = params;
      
      const res = await api.get('/', { 
        params: { 
          page, 
          limit, 
          statut: statut === 'Préparée' ? 'preparation' :
                 statut === 'En route' ? 'expediee' :
                 statut === 'Livrée' ? 'livre' :
                 statut === 'Échec de livraison' ? 'echec' : statut,
          livreur_id, 
          date_debut, 
          date_fin 
        }
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      // Transform data to include mapped status
      const expeditions = res.data.data?.expeditions?.map(exp => ({
        ...exp,
        statut_expedition: get().mapColisStatus(exp.statut),
        display_status: get().mapColisStatus(exp.statut)
      })) || [];
      
      set({ 
        expeditions,
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

  // Update package status (now works with colis ID)
  updateExpeditionStatus: async ({ id, statut_expedition, notes }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      // Map display status to colis status
      const colisStatut = statut_expedition === 'Préparée' ? 'preparation' :
                         statut_expedition === 'En route' ? 'expediee' :
                         statut_expedition === 'Livrée' ? 'livre' :
                         statut_expedition === 'Échec de livraison' ? 'echec' : statut_expedition;

      const res = await api.put(`/expeditions/${id}/statut`, { 
        statut_expedition: colisStatut,
        notes 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update status');
      }
      
      toast.success(res.data.message || "Statut du colis mis à jour");
      
      // Refresh both expeditions and packages lists
      await Promise.all([
        get().fetchExpeditions(),
        get().fetchColis()
      ]);
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update package status';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  // Create/update package
  manageColis: async ({ id, commande_id, livreur_id }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const method = id ? 'put' : 'post';
      const url = id ? `/colis/${id}` : '/colis';
      
      const res = await api[method](url, { 
        commande_id, 
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

  // List returns
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

  // Process return
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
}))