// hooks/useLivreur.js
'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const livreurApi = axios.create({
  baseURL: 'http://localhost:5000/utilisateurs',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useLivreurStore = create((set, get) => ({
  loading: false,
  error: null,

  // Create a delivery person
  ajouterLivreur: async (livreurData) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livreurApi.post('/creeLivreur', livreurData);
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to create delivery person');
      }
      
      toast.success(res.data.message || "Delivery person created successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to create delivery person';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update delivery person
  mettreAJourLivreur: async (id, updates) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livreurApi.put(`/mettreAJourLivreur/${id}`, updates);
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update delivery person');
      }
      
      toast.success(res.data.message || "Delivery person updated successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update delivery person';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Delete delivery person
  supprimerLivreur: async (id) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const res = await livreurApi.delete(`/supprimerLivreur/${id}`);
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to delete delivery person');
      }
      
      toast.success(res.data.message || "Delivery person deleted successfully");
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to delete delivery person';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}))

// Custom hooks
export const useAjouterLivreur = () => {
  const { ajouterLivreur, loading } = useLivreurStore();
  
  const mutateAsync = async (livreurData) => {
    try {
      const result = await ajouterLivreur(livreurData);
      return result;
    } catch (error) {
      console.error('Create livreur error:', error);
      throw error;
    }
  };

  return { mutateAsync, isLoading: loading };
};

export const useUpdateLivreur = () => {
  const { mettreAJourLivreur, loading } = useLivreurStore();
  
  const mutateAsync = async (id, updates) => {
    try {
      const result = await mettreAJourLivreur(id, updates);
      return result;
    } catch (error) {
      console.error('Update livreur error:', error);
      throw error;
    }
  };

  return { mutateAsync, isLoading: loading };
};

export const useDeleteLivreur = () => {
  const { supprimerLivreur, loading } = useLivreurStore();
  
  const mutateAsync = async (id) => {
    try {
      const result = await supprimerLivreur(id);
      return result;
    } catch (error) {
      console.error('Delete livreur error:', error);
      throw error;
    }
  };

  return { mutateAsync, isLoading: loading };
};