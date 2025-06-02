'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'

const api = axios.create({
  baseURL: 'http://localhost:5000/livraisons',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useLivraison = create((set, get) => ({
  livraisons: [],
  livraison: null,
  total: 0,
  loading: false,
  error: null,

  // Get available deliveries for assignment
  getLivraisonsDisponibles: async (token) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get('/disponibles', {
               headers: { Authorization: `Bearer ${token}` }

      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      const data = res.data.data || [];
      set({ 
        livraisons: data,
        total: data.length
      });
      return data;
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

  // Assign delivery to a delivery person
  assignerLivraison: async (livraisonId, livreurId, token) => {
    if (!livraisonId || !livreurId || get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(
        `/${livraisonId}/assigner`,
        { livreur_id: livreurId },
        {        headers: { Authorization: `Bearer ${token}` }
}
      );
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to assign delivery');
      }
      
      toast.success(res.data.message || "Delivery assigned successfully");
      
      // Refresh the available deliveries list
      await get().getLivraisonsDisponibles(token);
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to assign delivery';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Get deliveries by delivery person
  getLivraisonsParLivreur: async (livreurId, token) => {
    if (!livreurId || get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/livreur/${livreurId}`, {
             headers: { Authorization: `Bearer ${token}` }

      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Invalid response format');
      }
      
      const data = res.data.data || [];
      set({ 
        livraisons: data,
        total: data.length
      });
      return data;
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
  },

  clearError: () => set({ error: null })
}))