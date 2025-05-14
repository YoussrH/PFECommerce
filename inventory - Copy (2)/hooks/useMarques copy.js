import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useMarques = () => {
  const [state, setState] = useState({
    randomMarques: [],
    popularMarques: [],
    marquesByGenre: {},
    loading: {
      random: true,
      popular: true,
      byGenre: {}
    },
    errors: {
      random: null,
      popular: null,
      byGenre: {}
    },
    expiresAt: null
  });

  const fetchRandomMarques = useCallback(async () => {
    try {
      setState(prev => ({...prev, loading: {...prev.loading, random: true}}));
      const response = await axios.get('http://localhost:5000/marques/marques-aleatoires');
      setState(prev => ({
        ...prev,
        randomMarques: response.data.data,
        loading: {...prev.loading, random: false},
        expiresAt: response.data.expiresAt
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: {...prev.loading, random: false},
        errors: {...prev.errors, random: error.message}
      }));
    }
  }, []);

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
    fetchRandomMarques();
    fetchPopularMarques();

    const interval = setInterval(() => {
      if (state.expiresAt && new Date() >= new Date(state.expiresAt)) {
        fetchRandomMarques();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchRandomMarques, fetchPopularMarques, state.expiresAt]);

  return {
    ...state,
    isLoadingByGenre: (genre) => state.loading.byGenre[genre] || false,
    errorByGenre: (genre) => state.errors.byGenre[genre] || null,
    marquesByGenre: (genre) => state.marquesByGenre[genre] || null,
    refetchRandom: fetchRandomMarques,
    refetchPopular: fetchPopularMarques,
    getMarquesByGenre: fetchMarquesByGenre
  };
};

export default useMarques;