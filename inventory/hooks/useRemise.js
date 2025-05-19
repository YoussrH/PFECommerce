// hooks/useRemise.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';

export const useRemise = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remises, setRemises] = useState([]);

  const fetchRemises = useCallback(async (activeOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = 'http://localhost:5000/remises';
      if (activeOnly) {
        url = 'http://localhost:5000/remises/getActiveRemises';
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      setRemises(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Échec du chargement des remises';
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createRemise = useCallback(async (remiseData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        'http://localhost:5000/remises/createRemise',
        remiseData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setRemises(prev => [...prev, response.data]);
      toast.success('Remise créée avec succès');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Échec de la création de la remise';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateRemise = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(
        `http://localhost:5000/remises/updateRemise/${id}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setRemises(prev => prev.map(r => r.id === id ? response.data : r));
      toast.success('Remise mise à jour avec succès');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Échec de la mise à jour de la remise';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteRemise = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(
        `http://localhost:5000/remises/deleteRemise/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setRemises(prev => prev.filter(r => r.id !== id));
      toast.success('Remise supprimée avec succès');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Échec de la suppression de la remise';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getRemiseById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `http://localhost:5000/remises/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Échec de la récupération de la remise';
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    remises,
    loading,
    error,
    fetchRemises,
    createRemise,
    updateRemise,
    deleteRemise,
    getRemiseById,
    clearError: () => setError(null)
  };
};