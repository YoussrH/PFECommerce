'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'
import { useEffect } from 'react'

const livraisonApi = axios.create({
  baseURL: 'http://localhost:5000/livraisons',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useLivraisonStore = create((set, get) => ({
  livraisonsDisponibles: [],
  livraisonsLivreur: [],
  loading: false,
  error: null,

  // Fetch available deliveries
  fetchLivraisonsDisponibles: async () => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livraisonApi.get('/disponibles');
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        livraisonsDisponibles: res.data.data || []
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch available deliveries';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Assign delivery to delivery person
  assignerLivreur: async ({ livraisonId, livreurId }) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livraisonApi.put(`/${livraisonId}/assigner`, { livreur_id: livreurId });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to assign delivery person');
      }
      
      toast.success(res.data.message || "Delivery person assigned successfully");
      
      // Refresh available deliveries
      await get().fetchLivraisonsDisponibles();
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to assign delivery person';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get deliveries by delivery person
  fetchLivraisonsByLivreur: async (livreurId) => {
    if (get().loading || !livreurId) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livraisonApi.get(`/livreur/${livreurId}`);
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      set({ 
        livraisonsLivreur: res.data.data || []
      });
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch deliveries by delivery person';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}))

// Custom hooks
export const useLivraisonsDisponibles = () => {
  const { fetchLivraisonsDisponibles, loading, error } = useLivraisonStore();
  
  return {
    data: useLivraisonStore(state => state.livraisonsDisponibles),
    isLoading: loading,
    isError: !!error,
    refetch: fetchLivraisonsDisponibles
  };
};

export const useLivraisonsByLivreur = (livreurId) => {
  const { fetchLivraisonsByLivreur, loading, error } = useLivraisonStore();
  
  useEffect(() => {
    if (livreurId) {
      fetchLivraisonsByLivreur(livreurId);
    }
  }, [livreurId, fetchLivraisonsByLivreur]);

  return {
    data: useLivraisonStore(state => state.livraisonsLivreur),
    isLoading: loading,
    isError: !!error,
    refetch: () => fetchLivraisonsByLivreur(livreurId)
  };
};

export const useAssignLivreur = () => {
  const { assignerLivreur } = useLivraisonStore();
  
  const mutateAsync = async ({ livraisonId, livreurId }) => {
    try {
      const result = await assignerLivreur({ livraisonId, livreurId });
      return result;
    } catch (error) {
      console.error('Assign livreur error:', error);
      throw error;
    }
  };

  return { mutateAsync };
};