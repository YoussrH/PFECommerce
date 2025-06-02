import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';

const useReclamation = () => {
  const [reclamations, setReclamations] = useState([]);
  const [currentReclamation, setCurrentReclamation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    const { user } = useAuth()

  // Base URL for API requests (adjust to your backend URL)
  const API_BASE_URL = 'http://localhost:5000/reclamations';

  // Helper to reset error state
  const resetError = useCallback(() => setError(null), []);

  // Create a new reclamation (public route)
  const createReclamation = useCallback(async (reclamationData, files = []) => {
    setLoading(true);
    resetError();

    const formData = new FormData();
    Object.keys(reclamationData).forEach(key => {
      formData.append(key, reclamationData[key]);
    });
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/creerReclamation`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la réclamation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resetError]);

  // List reclamations (admin route)
  const listReclamations = useCallback(async (status = null) => {
    setLoading(true);
    resetError();

    try {
      const response = await axios.get(`${API_BASE_URL}/lister`, {
        params: { statut: status },
         headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
      });
      setReclamations(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des réclamations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resetError]);

  // View a single reclamation (admin route)
  const viewReclamation = useCallback(async (id) => {
    setLoading(true);
    resetError();

    try {
      const response = await axios.get(`${API_BASE_URL}/consulter/${id}`, {
         headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
      });
      setCurrentReclamation(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération de la réclamation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resetError]);

  // Respond to a reclamation (admin route)
  const respondToReclamation = useCallback(async (id, responseText) => {
    setLoading(true);
    resetError();

    // Optimistic update
    const previousReclamation = currentReclamation;
    setCurrentReclamation(prev => prev ? { ...prev, reponse: responseText, statut: 'traite' } : prev);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/repondre/${id}`,
        { reponse: responseText },
        { headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      setCurrentReclamation(response.data.data);
      return response.data;
    } catch (err) {
      setCurrentReclamation(previousReclamation); // Rollback on error
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de la réponse');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentReclamation, resetError]);

  // Archive a reclamation (admin route)
  const archiveReclamation = useCallback(async (id) => {
    setLoading(true);
    resetError();

    // Optimistic update
    const previousReclamations = reclamations;
    setReclamations(prev => prev.filter(r => r.id !== id));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/archiver/${id}`,
        {},
        {
           headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (err) {
      setReclamations(previousReclamations); // Rollback on error
      setError(err.response?.data?.message || 'Erreur lors de l\'archivage de la réclamation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reclamations, resetError]);

  // Restore a reclamation (admin route)
  const restoreReclamation = useCallback(async (id) => {
    setLoading(true);
    resetError();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/restaurer/${id}`,
        {},
        { headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      // Refresh the reclamations list after restoring
      await listReclamations('archive');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la restauration de la réclamation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listReclamations, resetError]);

  // Clean reclamations (admin route, for cron job)
  const cleanReclamations = useCallback(async () => {
    setLoading(true);
    resetError();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/nettoyer`,
        {},
        {
           headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        }
      );
      // Refresh the reclamations list after cleaning
      await listReclamations();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du nettoyage des réclamations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listReclamations, resetError]);

  return {
    reclamations,
    currentReclamation,
    loading,
    error,
    createReclamation,
    listReclamations,
    viewReclamation,
    respondToReclamation,
    archiveReclamation,
    restoreReclamation,
    cleanReclamations,
    resetError,
  };
};

export default useReclamation;