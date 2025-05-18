// hooks/useFactures.js
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';

const useFactures = () => {
  const { token } = useAuth();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalFactures: 0,
    montantTotal: 0,
    totalEnAttente: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    statut: 'tous',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Utility function to safely format amounts
  const formatAmount = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? 0 : num;
  };

  const fetchFactures = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`http://localhost:5000/factures?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Format the response data
      const formattedData = {
        ...response.data.data,
        factures: response.data.data.factures.map(f => ({
          ...f,
          montant: formatAmount(f.montant),
          date: f.date.split('T')[0] // Format date if needed
        })),
        stats: {
          ...response.data.data.stats,
          montantTotal: formatAmount(response.data.data.stats.montantTotal)
        }
      };
      
      setFactures(formattedData.factures);
      setStats(formattedData.stats);
      setPagination(formattedData.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des factures');
    } finally {
      setLoading(false);
    }
  };

  const downloadFacture = async (factureId) => {
    try {
      const response = await axios.get(`http://localhost:5000/factures/${factureId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${factureId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      throw err;
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const changePage = (newPage) => {
    fetchFactures(newPage);
  };

  useEffect(() => {
    if (token) {
      fetchFactures();
    }
  }, [filters, token]);

  return {
    factures,
    loading,
    error,
    stats,
    pagination,
    filters,
    fetchFactures,
    downloadFacture,
    updateFilters,
    changePage,
    statusColors: {
      livree: "bg-green-500",
      en_preparation: "bg-orange-500",
      annulee: "bg-red-500",
      retourne: "bg-red-800",
      remplacee: "bg-blue-500"
    },
    statusLabels: {
      livree: "Livrée",
      en_preparation: "En préparation",
      annulee: "Annulée",
      retourne: "Retournée",
      remplacee: "Remplacée"
    }
  };
};

export default useFactures;