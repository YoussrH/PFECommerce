// hooks/useFactures.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useFactures = () => {
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

  const formatAmount = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? 0 : num;
  };

  const fetchFactures = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(filters.statut !== 'tous' && { statut: filters.statut }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await axios.get(`http://localhost:5000/factures?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      clearTimeout(timeoutId);

      const formattedData = {
        ...response.data.data,
        factures: response.data.data.factures.map(f => ({
          ...f,
          montant: formatAmount(f.montant),
          date: f.date.split('T')[0]
        })),
        stats: {
          ...response.data.data.stats,
          montantTotal: formatAmount(response.data.data.stats.montantTotal)
        }
      };
      
      setFactures(formattedData.factures);
      setStats(formattedData.stats);
      setPagination(formattedData.pagination);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('La requête a expiré après 10 secondes');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la récupération des factures');
      }
      setFactures([]);
      setStats({
        totalFactures: 0,
        montantTotal: 0,
        totalEnAttente: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const downloadFacture = async (factureId) => {
    try {
      const response = await axios.get(`http://localhost:5000/factures/${factureId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
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
      setError('Erreur lors du téléchargement de la facture');
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const changePage = (newPage) => {
    setPagination(prev => ({...prev, page: newPage}));
    fetchFactures(newPage);
  };

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

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