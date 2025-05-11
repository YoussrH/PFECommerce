"use client"

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useMarques = () => {
  const [state, setState] = useState({
    popularMarques: [],
    marquesByGenre: {},
    loading: {
      popular: true,
      byGenre: {}
    },
    errors: {
      popular: null,
      byGenre: {}
    }
  });

  const fetchPopularMarques = useCallback(async () => {
    try {
      setState(prev => ({...prev, loading: {...prev.loading, popular: true}}));
      const response = await axios.get('http://localhost:5000/marques/marques-populaires');
      setState(prev => ({
        ...prev,
        popularMarques: response.data.data,
        loading: {...prev.loading, popular: false}
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: {...prev.loading, popular: false},
        errors: {...prev.errors, popular: error.message}
      }));
    }
  }, []);

  const fetchMarquesByGenre = useCallback(async (genre) => {
    try {
      setState(prev => ({
        ...prev,
        loading: {...prev.loading, byGenre: {...prev.loading.byGenre, [genre]: true}},
        errors: {...prev.errors, byGenre: {...prev.errors.byGenre, [genre]: null}}
      }));
      
      const response = await axios.get(`http://localhost:5000/marques/par-genre/${genre}`);
      setState(prev => ({
        ...prev,
        marquesByGenre: {...prev.marquesByGenre, [genre]: response.data.data},
        loading: {...prev.loading, byGenre: {...prev.loading.byGenre, [genre]: false}}
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: {...prev.loading, byGenre: {...prev.loading.byGenre, [genre]: false}},
        errors: {...prev.errors, byGenre: {...prev.errors.byGenre, [genre]: error.message}}
      }));
    }
  }, []);

  useEffect(() => {
    fetchPopularMarques();
  }, [fetchPopularMarques]);

  return {
    ...state,
    isLoadingByGenre: (genre) => state.loading.byGenre[genre] || false,
    errorByGenre: (genre) => state.errors.byGenre[genre] || null,
    marquesByGenre: (genre) => state.marquesByGenre[genre] || null,
    refetchPopular: fetchPopularMarques,
    getMarquesByGenre: fetchMarquesByGenre
  };
};

export default useMarques;