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

      toast.success('Discount created successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create discount';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getActiveRemises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        'http://localhost:5000/remises/getActiveRemises',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setRemises(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch active discounts';
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const applyRemiseToArticles = useCallback(async (remiseId, articleIds) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `http://localhost:5000/remises/${remiseId}/applyRemiseToArticles`,
        { articleIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      toast.success('Discount applied to articles successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to apply discount to articles';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeRemiseFromArticles = useCallback(async (remiseId, articleIds) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `http://localhost:5000/remises/${remiseId}/removeRemiseFromArticles`,
        { articleIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      toast.success('Discount removed from articles successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to remove discount from articles';
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
      
      toast.success('Discount updated successfully');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update discount';
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
      
      toast.success('Discount deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete discount';
      setError(errorMessage);
      toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    remises,
    createRemise,
    getActiveRemises,
    applyRemiseToArticles,
    removeRemiseFromArticles,
    updateRemise,
    deleteRemise,
    loading,
    error,
    clearError: () => setError(null)
  };
};