// hooks/useWishlist.js
"use client"
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'
export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth()
  const [listeEnvies, setListeEnvies] = useState([])
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Récupérer la liste d'envies
  const obtenirListeEnvies = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setChargement(true)
      const response = await axios.get('http://localhost:5000/liste-envies', {
        withCredentials: true
      })

      if (response.data.success) {
        setListeEnvies(response.data.data || [])
      }
    } catch (error) {
      setErreur(error.response?.data?.message || "Erreur lors du chargement de la liste d'envies")
      console.error("Erreur liste d'envies:", error)
    } finally {
      setChargement(false)
    }
  }, [isAuthenticated])

  // Vérifier si un article est dans la liste d'envies
  const verifierArticleDansListeEnvies = useCallback(async (articleId) => {
    if (!isAuthenticated) return false

    try {
      const response = await axios.get(
        `http://localhost:5000/liste-envies/verifier/${articleId}`,
        { withCredentials: true }
      )

      return response.data.success ? response.data.data.dans_liste_envies : false
    } catch (error) {
      console.error("Erreur vérification liste d'envies:", error)
      return false
    }
  }, [isAuthenticated])

  // Ajouter un article à la liste d'envies
  const ajouterAListeEnvies = useCallback(async (articleId) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter à votre liste d'envies")
      return false
    }

    try {
      setChargement(true)
      const response = await axios.post(
        'http://localhost:5000/liste-envies/ajouterAListeEnvies',
        { article_id: articleId },
        { withCredentials: true }
      )

      if (response.data.success) {
        await obtenirListeEnvies()
        toast.success("Article ajouté à votre liste d'envies")
        return true
      }
      return false
    } catch (error) {
      const message = error.response?.data?.message || "Erreur lors de l'ajout à la liste d'envies"
      toast.error(message)
      return false
    } finally {
      setChargement(false)
    }
  }, [isAuthenticated, obtenirListeEnvies])

  // Supprimer un article de la liste d'envies
  const supprimerDeListeEnvies = useCallback(async (itemId) => {
    if (!isAuthenticated) return false

    try {
      setChargement(true)
      const response = await axios.delete(
        `http://localhost:5000/liste-envies/supprimerDeListeEnvies/${itemId}`,
        { withCredentials: true }
      )

      if (response.data.success) {
        await obtenirListeEnvies()
        toast.success("Article retiré de votre liste d'envies")
        return true
      }
      return false
    } catch (error) {
      const message = error.response?.data?.message || "Erreur lors de la suppression de la liste d'envies"
      toast.error(message)
      return false
    } finally {
      setChargement(false)
    }
  }, [isAuthenticated, obtenirListeEnvies])

  // Basculer un article dans la liste d'envies
  const basculerListeEnvies = useCallback(async (articleId) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour gérer votre liste d'envies")
      return false
    }

    try {
      const estDansListe = listeEnvies.some(item => item.article.id === articleId)
      
      if (estDansListe) {
        const item = listeEnvies.find(item => item.article.id === articleId)
        if (item) {
          return await supprimerDeListeEnvies(item.id)
        }
        return false
      } else {
        return await ajouterAListeEnvies(articleId)
      }
    } catch (error) {
      console.error("Erreur bascule liste d'envies:", error)
      return false
    }
  }, [isAuthenticated, listeEnvies, supprimerDeListeEnvies, ajouterAListeEnvies])

  useEffect(() => {
    if (isAuthenticated) {
      obtenirListeEnvies()
    } else {
      setListeEnvies([])
    }
  }, [isAuthenticated, obtenirListeEnvies])

  return {
    listeEnvies,
    chargement,
    erreur,
    ajouterAListeEnvies,
    supprimerDeListeEnvies,
    basculerListeEnvies,
    verifierArticleDansListeEnvies,
    obtenirListeEnvies,
    estDansListeEnvies: (articleId) => listeEnvies.some(item => item.article.id === articleId)
  }
}