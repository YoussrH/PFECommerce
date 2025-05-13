"use client"

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useMarques = () => {
const [state, setState] = useState({
    popularMarques: [],
    marquesByGenre: {},
    articlesByMarque: {
      data: null,
      loading: false,
      error: null
    },
    loading: {
      popular: true,
      byGenre: {},
    },
    errors: {
      popular: null,
      byGenre: {},
      articles: null
    }
  });

  const [articlesByMarque, setArticlesByMarque] = useState({
    data: null,
    loading: false,
    error: null
  });

  const fetchPopularMarques = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, popular: true },
        errors: { ...prev.errors, popular: null }
      }));

      const response = await axios.get('http://localhost:5000/marques/marques-populaires');
      
      // Validate response structure
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error('Invalid data format received from server');
      }

      setState(prev => ({
        ...prev,
        popularMarques: response.data.data,
        loading: { ...prev.loading, popular: false }
      }));
    } catch (error) {
      console.error('Error fetching popular marques:', error);
      setState(prev => ({
        ...prev,
        popularMarques: [],
        loading: { ...prev.loading, popular: false },
        errors: { 
          ...prev.errors, 
          popular: error.response?.data?.message || error.message 
        }
      }));
    }
  }, []);

  const fetchMarquesByGenre = useCallback(async (genre) => {
    if (!genre) return;

    try {
      setState(prev => ({
        ...prev,
        loading: { 
          ...prev.loading, 
          byGenre: { ...prev.loading.byGenre, [genre]: true } 
        },
        errors: { 
          ...prev.errors, 
          byGenre: { ...prev.errors.byGenre, [genre]: null } 
        }
      }));

      const response = await axios.get(`http://localhost:5000/marques/par-genre/${genre}`);
      
      // Validate response structure
      if (!response.data?.success || !response.data.data?.marques) {
        throw new Error(`Invalid data format for genre ${genre}`);
      }

      setState(prev => ({
        ...prev,
        marquesByGenre: { 
          ...prev.marquesByGenre, 
          [genre]: response.data.data
        },
        loading: { 
          ...prev.loading, 
          byGenre: { ...prev.loading.byGenre, [genre]: false } 
        }
      }));
    } catch (error) {
      console.error(`Error fetching marques for genre ${genre}:`, error);
      setState(prev => ({
        ...prev,
        loading: { 
          ...prev.loading, 
          byGenre: { ...prev.loading.byGenre, [genre]: false } 
        },
        errors: { 
          ...prev.errors, 
          byGenre: { 
            ...prev.errors.byGenre, 
            [genre]: error.response?.data?.message || error.message 
          } 
        }
      }));
    }
  }, []);

  useEffect(() => {
    fetchPopularMarques();
  }, [fetchPopularMarques]);

  // Memoized selector functions
  const isLoadingByGenre = useCallback((genre) => {
    return state.loading.byGenre[genre] || false;
  }, [state.loading.byGenre]);

  const errorByGenre = useCallback((genre) => {
    return state.errors.byGenre[genre] || null;
  }, [state.errors.byGenre]);

  const marquesByGenre = useCallback((genre) => {
    return state.marquesByGenre[genre] || { genre: null, marques: [] };
  }, [state.marquesByGenre]);

const fetchArticlesByMarque = useCallback(async (marqueId) => {
    try {
      setState(prev => ({
        ...prev,
        articlesByMarque: {
          data: null,
          loading: true,
          error: null
        }
      }));

      const response = await axios.get(`http://localhost:5000/marques/${marqueId}/articles`);
      console.log('API Response:', response.data);

      if (!response.data?.success) {
        throw new Error('Invalid response format');
      }

      setState(prev => {
        const newState = {
          ...prev,
          articlesByMarque: {
            data: response.data.data,
            loading: false,
            error: null
          }
        };
        console.log('Updated articlesByMarque:', newState.articlesByMarque);
        return newState;
      });
    } catch (error) {
      console.error('Error fetching articles by marque:', error);
      setState(prev => ({
        ...prev,
        articlesByMarque: {
          data: null,
          loading: false,
          error: error.response?.data?.message || error.message
        }
      }));
    }
  }, []);


  return {
    popularMarques: state.popularMarques,
    loading: state.loading,
    errors: state.errors,
    isLoadingByGenre,
    errorByGenre,
    refetchPopular: fetchPopularMarques,
    getMarquesByGenre: fetchMarquesByGenre,
    marquesByGenre,
    popularMarques: state.popularMarques,
    marquesByGenre: state.marquesByGenre,
    articlesByMarque: state.articlesByMarque,
    fetchArticlesByMarque,
  };
};

export default useMarques;