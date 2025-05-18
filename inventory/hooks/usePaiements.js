// hooks/usePaiements.js
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';

const usePaiements = () => {
  const { token } = useAuth();
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

  const fetchPaiements = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...filters
      });

      const response = await axios.get(`http://localhost:5000/paiements?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPaiements(response.data.data.paiements);
      setStats(response.data.data.stats);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des paiements');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const changePage = (newPage) => {
    fetchPaiements(newPage);
  };

  useEffect(() => {
    if (token) {
      fetchPaiements();
    }
  }, [filters, token]);

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

  };
};

export default usePaiements;