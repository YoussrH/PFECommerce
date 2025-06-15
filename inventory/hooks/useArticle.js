// hooks/useArticle.js
"use client"
import { useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'

export const useArticle = () => {
  const { isAuthenticated, user,isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)

  // Base API URL
  const API_URL = 'http://localhost:5000/articles'

  // Helper function to handle API errors
  const handleError = (error, defaultMessage) => {
    const message = error.response?.data?.message || defaultMessage
    setError(message)
    toast.error(message)
    console.error(error)
    return null
  }

const fetchAllArticles = useCallback(async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${API_URL}/obtenirTousLesArticles`);
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
    handleError(error, "Failed to fetch articles");
    setArticles([]);
  } finally {
    setLoading(false);
  }
}, []);

const fetchArticleById = useCallback(async (id) => {
  setLoading(true);
  try {
    const response = await axios.get(`${API_URL}/obtenirArticleParId/${id}`);
    if (response.data.success) {
      setArticle(response.data.donnees);
      return response.data; // Return the full response with success and donnees
    }
    return { success: false, donnees: null };
  } catch (error) {
    handleError(error, "Échec de la récupération de l'article");
    return { success: false, donnees: null };
  } finally {
    setLoading(false);
  }
}, []);
  // Add article (admin only)
  const addArticle = useCallback(async (articleData) => {
    if (!isAuthenticated || !user?.isAdmin) {
      toast.error("Unauthorized access")
      return false
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/ajouterArticle`, articleData, {
        withCredentials: true
      })
      if (response.data.success) {
        toast.success("Article added successfully")
        return response.data.data
      }
      return false
    } catch (error) {
      handleError(error, "Failed to add article")
      return false
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.isAdmin])

// Update article (admin only)
const updateArticle = useCallback(async (id, articleData) => {
  if (!isAuthenticated || !user?.isAdmin) {
    toast.error("Unauthorized access");
    return false;
  }

  setLoading(true);
  try {
    const response = await axios.put(
      `${API_URL}/mettreAJourArticle/${id}`,
      articleData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    if (response.data.success) {
      toast.success("Article updated successfully");
      return response.data.donnees;
    }
    return false;
  } catch (error) {
    console.error("Update article error:", error);
    
    let errorMessage = "Failed to update article";
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = "Unauthorized - Please login again";
          break;
        case 403:
          errorMessage = "Permission denied";
          break;
        case 404:
          errorMessage = "Article not found";
          break;
        case 500:
          errorMessage = error.response.data?.message || "Server error";
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    }

    toast.error(errorMessage);
    return false;
  } finally {
    setLoading(false);
  }
}, [isAuthenticated, user?.isAdmin, user?.token]);
const deleteArticle = useCallback(async (id) => {
  if (!isAuthenticated || !isAdmin) {
    toast.error("Accès non autorisé");
    return false;
  }

  setLoading(true);
  try {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet article ? Cette action est irréversible.");
    if (!confirmed) return false;

    const response = await axios.delete(
      `${API_URL}/supprimerArticle/${id}`,
      {  
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    if (response.data.success) {
      toast.success("Article supprimé définitivement avec succès");
      fetchAllArticles(); // Refresh the list
      return true;
    }
    return false;
  } catch (error) {
    toast.error(error.response?.data?.message || "Échec de la suppression définitive");
    return false;
  } finally {
    setLoading(false);
  }
}, [isAuthenticated, isAdmin, user?.token, fetchAllArticles]);
// Get latest articles
  const fetchLatestArticles = useCallback(async (limit = 20) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/obtenirDerniersArticles`)
      if (response.data.success) {
        setArticles(response.data.donnees || [])
        return response.data.donnees
      }
      return []
    } catch (error) {
      handleError(error, "Failed to fetch latest articles")
      return []
    } finally {
      setLoading(false)
    }
  }, [])


  // Search articles
  const searchArticles = useCallback(async (query) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/rechercherArticles`, {
        params: { requete: query }
      })
      if (response.data.success) {
        setArticles(response.data.donnees || [])
        return response.data.donnees
      }
      return []
    } catch (error) {
      handleError(error, "Failed to search articles")
      return []
    } finally {
      setLoading(false)
    }
  }, [])




  // Get articles count
  const fetchArticlesCount = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/count`)
      if (response.data.success) {
        setCount(response.data.count)
        return response.data.count
      }
      return 0
    } catch (error) {
      handleError(error, "Failed to fetch articles count")
      return 0
    } finally {
      setLoading(false)
    }
  }, [])



  return {
    // State
    articles,
    article,
    loading,
    error,
    count,

    // Functions
    fetchAllArticles,
    fetchArticleById,
    addArticle,
    updateArticle,
    deleteArticle,
    fetchLatestArticles,
    searchArticles,

    fetchArticlesCount,

  }
}