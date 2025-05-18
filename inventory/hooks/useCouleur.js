// hooks/useCouleur.js
"use client"
import { useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export const useCouleurs = () => {
  const [couleurs, setCouleurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCouleurs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:5000/couleurs')
      setCouleurs(response.data)
      return response.data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch colors")
      toast.error("Failed to fetch colors")
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    couleurs,
    loading,
    error,
    fetchCouleurs
  }
}