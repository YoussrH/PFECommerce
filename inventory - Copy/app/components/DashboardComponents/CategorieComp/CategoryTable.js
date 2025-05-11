"use client"
import React, { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, Search, Edit, Trash2, Plus, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CategoryForm from "./CategoryForm"

const CategoryTable = () => {
  const { token } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await axios.get("http://localhost:5000/categories", {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        const categoryMap = {}
        const rootCategories = []
        
        response.data.forEach(category => {
          categoryMap[category.id] = {
            ...category,
            subcategories: [],
            level: 0
          }
        })
        
        response.data.forEach(category => {
          if (category.parent_id && categoryMap[category.parent_id]) {
            categoryMap[category.parent_id].subcategories.push(categoryMap[category.id])
            categoryMap[category.id].level = categoryMap[category.parent_id].level + 1
          } else if (!category.parent_id) {
            rootCategories.push(categoryMap[category.id])
          }
        })
        
        setCategories(rootCategories)
      } catch (error) {
        toast.error("Échec du chargement des catégories")
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategories()
  }, [token])

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      toast.custom((t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-medium mb-4">Voulez-vous vraiment supprimer cette catégorie ?</p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                toast.dismiss(t)
                setDeletingId(null)
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                toast.dismiss(t)
                try {
                  await axios.delete(`http://localhost:5000/categories/supprimerCategorie/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  setCategories(prev => prev.filter(category => category.id !== id))
                  toast.success('Catégorie supprimée avec succès')
                } catch (error) {
                  toast.error(error.response?.data?.error || 'Échec de la suppression')
                  console.error('Delete error:', error)
                } finally {
                  setDeletingId(null)
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </div>
      ), { duration: Infinity })
    } catch (error) {
      setDeletingId(null)
      console.error('Error showing confirmation:', error)
    }
  }

  const handleAddCategory = async (formData) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/categories/ajouterCategorie",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
  
      toast.success("Catégorie ajoutée avec succès")
      setIsAddModalOpen(false)
      const fetchResponse = await axios.get("http://localhost:5000/categories", {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const categoryMap = {}
      const newRootCategories = []
      
      fetchResponse.data.forEach(category => {
        categoryMap[category.id] = {
          ...category,
          subcategories: [],
          level: 0
        }
      })
      
      fetchResponse.data.forEach(category => {
        if (category.parent_id && categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].subcategories.push(categoryMap[category.id])
          categoryMap[category.id].level = categoryMap[category.parent_id].level + 1
        } else if (!category.parent_id) {
          newRootCategories.push(categoryMap[category.id])
        }
      })
      
      setCategories(newRootCategories)
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error(error.response?.data?.message || "Échec de l'ajout de la catégorie")
    }
  }

  const handleEditCategory = async (formData) => {
    try {
      await axios.put(
        `http://localhost:5000/categories/mettreAJourCategorie/${currentCategory.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Catégorie modifiée avec succès")
      setIsEditModalOpen(false)
      
      const response = await axios.get("http://localhost:5000/categories", {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const categoryMap = {}
      const updatedRootCategories = []
      
      response.data.forEach(category => {
        categoryMap[category.id] = {
          ...category,
          subcategories: [],
          level: 0
        }
      })
      
      response.data.forEach(category => {
        if (category.parent_id && categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].subcategories.push(categoryMap[category.id])
          categoryMap[category.id].level = categoryMap[category.parent_id].level + 1
        } else if (!category.parent_id) {
          updatedRootCategories.push(categoryMap[category.id])
        }
      })
      
      setCategories(updatedRootCategories)
    } catch (error) {
      toast.error(error.response?.data?.message || "Échec de la modification de la catégorie")
      console.error("Error editing category:", error)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderCategoryRow = (category) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0

    return (
      <React.Fragment key={category.id}>
        <TableRow className="hover:bg-gray-50 ">
          <TableCell className="flex items-center p-1 sm:p-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 mr-1 sm:mr-2"
                onClick={() => toggleRow(category.id)}
              >
                {expandedRows[category.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </Button>
            ) : (
              <div className="w-5 mr-1 sm:mr-2"></div>
            )}
            <span 
              className="truncate max-w-[120px] sm:max-w-[150px] md:max-w-none text-xs sm:text-xs"
              style={{ paddingLeft: `${category.level * (isMobile ? 12 : 20)}px` }}
            >
              {category.libelle}
            </span>
          </TableCell>
          
          {!isMobile && (
            <TableCell className="p-1 sm:p-2 text-xs sm:text-xs">
              {category.parent_id ? "Sous-catégorie" : "Catégorie principale"}
            </TableCell>
          )}

          <TableCell className="p-1 sm:p-2 text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-sans text-sm">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentCategory(category)
                    setIsEditModalOpen(true)
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(category.id)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {expandedRows[category.id] &&
          category.subcategories?.map((subcategory) => renderCategoryRow(subcategory))}
      </React.Fragment>
    )
  }

  return (
    <div className="container mx-auto px-1 sm:px-2 py-2 sm:py-4">
      <Card>
        <CardHeader className="p-2 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <CardTitle className="text-xs sm:text-lg md:text-xl">Gestion des catégories</CardTitle>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              size={isMobile ? "icon" : "default"}
              className={isMobile ? "rounded-full" : ""}
            >
              {isMobile ? (
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une catégorie
                </>
              )}
            </Button>
          </div>
        </CardHeader>
     
        <CardContent className="p-2 sm:p-4">
          <div className="relative w-full mb-2 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-7 sm:pl-8 text-sm sm:text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[300px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-1 sm:p-2 text-sm sm:text-xs">Nom</TableHead>
                    {!isMobile && <TableHead className="p-1 sm:p-2 text-sm sm:text-xs">Type</TableHead>}
                    <TableHead className="p-1 sm:p-2 text-right text-sm sm:text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                      renderCategoryRow(category)
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 2 : 3} className="text-center p-4 text-sm sm:text-xs">
                        {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            onSubmit={handleAddCategory}
            onCancel={() => setIsAddModalOpen(false)}
            categories={categories}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            initialValues={currentCategory}
            onSubmit={handleEditCategory}
            onCancel={() => setIsEditModalOpen(false)}
            categories={categories.filter(cat => cat.id !== currentCategory?.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CategoryTable