// hooks/useReclamations.js
"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';

export const useReclamations = () => {
  const { user, token } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReclamation, setSelectedReclamation] = useState(null);

  // Common axios instance with base config
  const api = axios.create({
    baseURL: 'http://localhost:5000/reclamations',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    withCredentials: true
  });

  // Fetch all reclamations with optional status filter
  const fetchReclamations = useCallback(async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (status) params.statut = status;
      
      const response = await api.get('/lister', { params });
      
      if (response.data.success) {
        setReclamations(response.data.data);
        return response.data.data;
      }
      throw new Error('Failed to fetch reclamations');
    } catch (err) {
      console.error('Error fetching reclamations:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error fetching reclamations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Fetch a single reclamation by ID
  const fetchReclamationById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/consulter/${id}`);
      
      if (response.data.success) {
        setSelectedReclamation(response.data.data);
        return response.data.data;
      }
      throw new Error('Reclamation not found');
    } catch (err) {
      console.error('Error fetching reclamation:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error fetching reclamation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Create a new reclamation
  const createReclamation = useCallback(async (reclamationData, files = []) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      
      // Append all fields to formData
      Object.entries(reclamationData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Append files if any
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await axios.post(
        'http://localhost:5000/reclamations/creerReclamation',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        toast.success('Reclamation created successfully');
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create reclamation');
    } catch (err) {
      console.error('Error creating reclamation:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error creating reclamation');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Respond to a reclamation
  const respondToReclamation = useCallback(async (id, responseText) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/repondre/${id}`, {
        reponse: responseText
      });
      
      if (response.data.success) {
        toast.success('Response sent successfully');
        // Update the reclamation in state
        setReclamations(prev => prev.map(r => 
          r.id === id ? { ...r, statut: 'traite', reponse: responseText } : r
        ));
        if (selectedReclamation?.id === id) {
          setSelectedReclamation(prev => ({
            ...prev,
            statut: 'traite',
            reponse: responseText
          }));
        }
        return response.data.data;
      }
      throw new Error('Failed to send response');
    } catch (err) {
      console.error('Error responding to reclamation:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error responding to reclamation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, selectedReclamation]);

  // Archive a reclamation
  const archiveReclamation = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/archiver/${id}`);
      
      if (response.data.success) {
        toast.success('Reclamation archived successfully');
        // Update the reclamation in state
        setReclamations(prev => prev.map(r => 
          r.id === id ? { ...r, statut: 'archive' } : r
        ));
        return response.data.data;
      }
      throw new Error('Failed to archive reclamation');
    } catch (err) {
      console.error('Error archiving reclamation:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error archiving reclamation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Restore an archived reclamation
  const restoreReclamation = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/restaurer/${id}`);
      
      if (response.data.success) {
        toast.success('Reclamation restored successfully');
        // Update the reclamation in state
        setReclamations(prev => prev.map(r => 
          r.id === id ? { ...r, statut: 'traite' } : r
        ));
        return response.data.data;
      }
      throw new Error('Failed to restore reclamation');
    } catch (err) {
      console.error('Error restoring reclamation:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error restoring reclamation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Clean up reclamations (background task)
  const cleanUpReclamations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/nettoyer');
      
      if (response.data.success) {
        toast.success('Reclamations cleaned up successfully');
        // Refresh the list
        await fetchReclamations();
        return response.data.data;
      }
      throw new Error('Failed to clean up reclamations');
    } catch (err) {
      console.error('Error cleaning up reclamations:', err);
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Error cleaning up reclamations');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, fetchReclamations]);

  // Automatically fetch reclamations when the hook is used
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchReclamations();
    }
  }, [user, fetchReclamations]);

  return {
    reclamations,
    selectedReclamation,
    loading,
    error,
    fetchReclamations,
    fetchReclamationById,
    createReclamation,
    respondToReclamation,
    archiveReclamation,
    restoreReclamation,
    cleanUpReclamations,
    setSelectedReclamation
  };
};