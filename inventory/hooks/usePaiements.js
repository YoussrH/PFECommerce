// hooks/usePaiements.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const usePaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPaiements: 0,
    montantTotal: 0,
    totalRetournes: 0
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

  const fetchPaiements = useCallback(async (page = 1) => {
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

      const response = await axios.get(`http://localhost:5000/paiements?${params.toString()}`, {
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
        paiements: response.data.data.paiements.map(p => ({
          ...p,
          montant: formatAmount(p.montant),
          date_paiement: p.date_paiement.split('T')[0]
        })),
        stats: {
          ...response.data.data.stats,
          montantTotal: formatAmount(response.data.data.stats.montantTotal)
        }
      };
      
      setPaiements(formattedData.paiements);
      setStats(formattedData.stats);
      setPagination(formattedData.pagination);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('La requête a expiré après 10 secondes');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la récupération des paiements');
      }
      setPaiements([]);
      setStats({
        totalPaiements: 0,
        montantTotal: 0,
        totalRetournes: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const changePage = (newPage) => {
    setPagination(prev => ({...prev, page: newPage}));
    fetchPaiements(newPage);
  };

  useEffect(() => {
    fetchPaiements();
  }, [fetchPaiements]);

  return {
    paiements,
    loading,
    error,
    stats,
    pagination,
    filters,
    fetchPaiements,
    updateFilters,
    changePage,
    paymentMethods: {
      carte: "Carte Bancaire",
      especes: "Espèces",
      virement: "Virement",
      cheque: "Chèque"
    },
    statusColors: {
      livree: "bg-green-500",
      retourne: "bg-red-800"
    },
    statusLabels: {
      livree: "Payé",
      retourne: "Retourné"
    }
  };
};

export default usePaiements;