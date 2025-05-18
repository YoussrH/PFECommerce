"use client"
import { useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.get('http://localhost:5000/categories', {
        headers,
        withCredentials: true
      })
      setCategories(response.data)
      return response.data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch categories")
      toast.error(error.response?.data?.message || "Failed to fetch categories")
      return []
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchHierarchicalCategories = useCallback(async () => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.get('http://localhost:5000/categories/hierarchie', {
        headers,
        withCredentials: true
      })
      return response.data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch hierarchical categories")
      toast.error(error.response?.data?.message || "Failed to fetch hierarchical categories")
      return []
    } finally {
      setLoading(false)
    }
  }, [token])

  const addCategory = useCallback(async (categoryData) => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.post('http://localhost:5000/categories/ajouterCategorie', categoryData, {
        headers,
        withCredentials: true
      })
      toast.success("Category added successfully")
      await fetchCategories() // Refresh the categories list
      return response.data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add category")
      toast.error(error.response?.data?.message || "Failed to add category")
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, token])

  const updateCategory = useCallback(async (id, categoryData) => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.put(`http://localhost:5000/categories/mettreAJourCategorie/${id}`, categoryData, {
        headers,
        withCredentials: true
      })
      toast.success("Category updated successfully")
      await fetchCategories() // Refresh the categories list
      return response.data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update category")
      toast.error(error.response?.data?.message || "Failed to update category")
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, token])

  const deleteCategory = useCallback(async (id) => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.delete(`http://localhost:5000/categories/supprimerCategorie/${id}`, {
        headers,
        withCredentials: true
      })
      toast.success("Category deleted successfully")
      await fetchCategories() // Refresh the categories list
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete category")
      toast.error(error.response?.data?.message || "Failed to delete category")
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, token])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchHierarchicalCategories,
    addCategory,
    updateCategory,
    deleteCategory
  }
}