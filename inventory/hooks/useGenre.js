// hooks/useGenre.js
"use client"
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';

export const useGenre = () => {
  const { isAuthenticated, user } = useAuth();
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/genres';

  const fetchAllGenres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setGenres(response.data || []);
      return response.data || [];
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      toast.error('Failed to fetch genres');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGenreById = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/obtenirGenreParId/${id}`);
      setGenre(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      toast.error('Failed to fetch genre');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addGenre = useCallback(async (genreData) => {
    if (!isAuthenticated || !user?.isAdmin) {
      toast.error('Unauthorized access');
      return false;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ajouterGenre`, genreData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      toast.success('Genre added successfully');
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      toast.error(error.response?.data?.error || 'Failed to add genre');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.isAdmin]);

  const updateGenre = useCallback(async (id, genreData) => {
    if (!isAuthenticated || !user?.isAdmin) {
      toast.error('Unauthorized access');
      return false;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/mettreAJourGenre/${id}`, genreData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      toast.success('Genre updated successfully');
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      toast.error(error.response?.data?.error || 'Failed to update genre');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.isAdmin]);

  const deleteGenre = useCallback(async (id) => {
    if (!isAuthenticated || !user?.isAdmin) {
      toast.error('Unauthorized access');
      return false;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/supprimerGenre/${id}`, {
        withCredentials: true,
      });
      toast.success('Genre deleted successfully');
      return true;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      toast.error(error.response?.data?.error || 'Failed to delete genre');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.isAdmin]);

  return {
    genres,
    genre,
    loading,
    error,
    fetchAllGenres,
    fetchGenreById,
    addGenre,
    updateGenre,
    deleteGenre,
  };
};