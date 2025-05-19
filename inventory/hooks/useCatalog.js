"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';

const useCatalog = () => {
  const { isAuthenticated, user } = useAuth();
  const API_URL = 'http://localhost:5000';

  // Articles state
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState(null);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // Marques state
  const [marques, setMarques] = useState([]);
  const [marquesLoading, setMarquesLoading] = useState(false);
  const [marquesError, setMarquesError] = useState(null);

  // Genres state
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [genresError, setGenresError] = useState(null);

  // Error handler
  const handleError = (error, defaultMessage, setErrorFn) => {
    const message = error.response?.data?.message || defaultMessage;
    if (setErrorFn) setErrorFn(message);
    toast.error(message);
    console.error(error);
    return null;
  };
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState(null);

  // Add these new functions
  const fetchArticlesByMarque = useCallback(async (marqueIds) => {
    setFilterLoading(true);
    try {
      const response = await axios.post(`${API_URL}/articles/filtrerArticles`, {
        filtres: [
          {
            category: "Marques",
            filter: marqueIds.map(id => 
              marques.find(m => m.id === id)?.libelle
            ).filter(Boolean)
          }
        ]
      });
      setFilteredArticles(response.data.donnees);
      return response.data.donnees;
    } catch (error) {
      handleError(error, "Failed to fetch articles by marque", setFilterError);
      return [];
    } finally {
      setFilterLoading(false);
    }
  }, [marques]);

  const fetchArticlesByCategorie = useCallback(async (categorieIds) => {
    setFilterLoading(true);
    try {
      const response = await axios.post(`${API_URL}/articles/filtrerArticles`, {
        filtres: [
          {
            category: "Catégories",
            filter: categories.find(c => c.id === categorieIds[0])?.libelle
          }
        ]
      });
      setFilteredArticles(response.data.donnees);
      return response.data.donnees;
    } catch (error) {
      handleError(error, "Failed to fetch articles by category", setFilterError);
      return [];
    } finally {
      setFilterLoading(false);
    }
  }, [categories]);

  const fetchArticlesByGenre = useCallback(async (genreIds) => {
    setFilterLoading(true);
    try {
      const response = await axios.post(`${API_URL}/articles/filtrerArticles`, {
        filtres: [
          {
            category: "Genres",
            filter: genres.find(g => g.id === genreIds[0])?.libelle
          }
        ]
      });
      setFilteredArticles(response.data.donnees);
      return response.data.donnees;
    } catch (error) {
      handleError(error, "Failed to fetch articles by genre", setFilterError);
      return [];
    } finally {
      setFilterLoading(false);
    }
  }, [genres]);
  // Fetch all articles
  const fetchAllArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/articles/obtenirTousLesArticles`);
      if (response.data.success) {
        const formattedArticles = response.data.donnees.map(article => ({
          id: article.id,
          nom_produit: article.nom_produit || "N/A",
          prix: article.prix || 0,
          prix_final: article.prix_final || article.prix || 0,
          sku: article.sku || "N/A",
          stock: article.stock || 0,
          genre: { libelle: article.genre?.libelle || "N/A" },
          categorie: { libelle: article.categorie?.libelle || "N/A" },
          marque: { libelle: article.marque?.libelle || "N/A" },
          couleurs: article.couleurs || [],
          tailles_par_couleur: article.tailles_par_couleur || {},
          primaryImage: article.primaryImage || 
                       (article.images_couleurs?.[0]?.image_url || ''),
          variations: article.variations || []
        }));
        setArticles(formattedArticles);
      }
    } catch (error) {
      handleError(error, "Failed to fetch articles", setArticlesError);
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  // Fetch all categories
  const fetchAllCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      handleError(error, "Failed to fetch categories", setCategoriesError);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch all marques
  const fetchAllMarques = useCallback(async () => {
    setMarquesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/marques`);
      setMarques(response.data);
    } catch (error) {
      handleError(error, "Failed to fetch marques", setMarquesError);
      setMarques([]);
    } finally {
      setMarquesLoading(false);
    }
  }, []);

  // Fetch all genres
  const fetchAllGenres = useCallback(async () => {
    setGenresLoading(true);
    try {
      const response = await axios.get(`${API_URL}/genres`);
      setGenres(response.data);
    } catch (error) {
      handleError(error, "Failed to fetch genres", setGenresError);
      setGenres([]);
    } finally {
      setGenresLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchAllArticles();
    fetchAllCategories();
    fetchAllMarques();
    fetchAllGenres();
  }, [fetchAllArticles, fetchAllCategories, fetchAllMarques, fetchAllGenres]);

  return {
    // Articles
    articles,
    articlesLoading,
    articlesError,
    fetchAllArticles,

    // Categories
    categories,
    categoriesLoading,
    categoriesError,
    fetchAllCategories,
    
    // Marques
    marques,
    marquesLoading,
    marquesError,
    fetchAllMarques,
    
    // Genres
    genres,
    genresLoading,
    genresError,
    fetchAllGenres,
    filteredArticles,
    filterLoading,
    filterError,
    fetchArticlesByMarque,
    fetchArticlesByCategorie,
    fetchArticlesByGenre
  };
};

export default useCatalog;