"use client"
import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'

export const useEvenements = () => {
  const [evenements, setEvenements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()

  const fetchEvenements = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get('http://localhost:5000/evenements', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        timeout: 8000,
        withCredentials: true
      })
      
      if (response.status === 200) {
        if (Array.isArray(response.data)) {
          // Filter out inactive events and sort by date
          const activeEvents = response.data
            .filter(event => event.est_actif)
            .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
          
          setEvenements(activeEvents)
          
          if (activeEvents.length === 0) {
            toast.info('Aucun événement actif disponible')
          }
          return activeEvents
        }
        throw new Error("Format de données invalide: tableau attendu")
      }
      throw new Error(`La requête a échoué avec le statut ${response.status}`)
    } catch (error) {
      let errorMsg = "Échec du chargement des événements"
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = "Timeout - Le serveur ne répond pas"
      } else if (error.response) {
        errorMsg = error.response.data?.message || 
                  `Erreur serveur: ${error.response.status}`
      } else if (error.request) {
        errorMsg = "Pas de réponse du serveur - Vérifiez votre connexion"
      } else {
        errorMsg = error.message || "Erreur réseau"
      }

      setError(errorMsg)
      toast.error(errorMsg)
      return []
    } finally {
      setLoading(false)
    }
  }, [token])

  const importEventsForYear = useCallback(async (year) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/evenements/importer-evenements/${year}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        withCredentials: true
      })
      
      toast.success(`Événements importés pour l'année ${year}`)
      await fetchEvenements() // Refresh the events list
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Échec de l'importation des événements"
      setError(errorMsg)
      toast.error(errorMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchEvenements, token])

  const toggleEventStatus = useCallback(async (eventId, currentStatus) => {
    setLoading(true)
    try {
      const response = await axios.patch(
        `http://localhost:5000/evenements/${eventId}/toggle-status`,
        { est_actif: !currentStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      )
      
      toast.success(`Statut de l'événement mis à jour`)
      await fetchEvenements() // Refresh the events list
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Échec de la mise à jour du statut"
      setError(errorMsg)
      toast.error(errorMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchEvenements, token])

  const addOrUpdateEvent = useCallback(async (eventData, eventId = null) => {
    setLoading(true)
    try {
      let response
      
      if (eventId) {
        // Update existing event
        response = await axios.put(
          `http://localhost:5000/evenements/${eventId}`,
          eventData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        )
      } else {
        // Create new event
        response = await axios.post(
          'http://localhost:5000/evenements',
          eventData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        )
      }
      
      toast.success(eventId ? 'Événement mis à jour' : 'Événement créé')
      await fetchEvenements() // Refresh the events list
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                     (eventId ? "Échec de la mise à jour" : "Échec de la création")
      setError(errorMsg)
      toast.error(errorMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchEvenements, token])

  const deleteEvent = useCallback(async (eventId) => {
    setLoading(true)
    try {
      await axios.delete(`http://localhost:5000/evenements/${eventId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      toast.success('Événement supprimé')
      await fetchEvenements() // Refresh the events list
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Échec de la suppression"
      setError(errorMsg)
      toast.error(errorMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchEvenements, token])

  useEffect(() => {
    fetchEvenements()
  }, [fetchEvenements])

  return {
    evenements,
    loading,
    error,
    fetchEvenements,
    importEventsForYear,
    toggleEventStatus,
    addOrUpdateEvent,
    deleteEvent,
    refetch: fetchEvenements
  }
}