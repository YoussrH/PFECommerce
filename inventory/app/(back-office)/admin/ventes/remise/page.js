'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRemise } from '@/hooks/useRemise'

export default function GestionRemises() {
  const router = useRouter()
  const { remises, loading, error, fetchRemises, deleteRemise } = useRemise()
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      // Reset to first page when search term changes
      setCurrentPage(1)
    }, 500)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchTerm])

  // Load remises on mount and when debounced term changes
  useEffect(() => {
    const loadRemises = async () => {
      try {
        await fetchRemises()
      } catch (error) {
        toast.error(error || 'Échec du chargement des remises')
      }
    }

    loadRemises()
  }, [fetchRemises])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Filter remises based on search term and status
  const filteredRemises = remises.filter(remise => {
    const matchesSearch = 
      remise.code?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      remise.libelle?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    
    const matchesStatus = 
      filterStatus === 'tous' ||
      (filterStatus === 'actives' && remise.est_active) ||
      (filterStatus === 'inactives' && !remise.est_active)
    
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalItems = filteredRemises.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedRemises = filteredRemises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSupprimerRemise = async (id) => {
    try {
      await deleteRemise(id)
      toast.success('Remise supprimée avec succès')
      // Reset to first page after deletion
      setCurrentPage(1)
    } catch (error) {
      toast.error(error || 'Échec de la suppression')
    }
  }

  const formaterDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'PP', { locale: fr })
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)))
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when items per page changes
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Remises</CardTitle>
              <CardDescription>
                Créez et gérez les remises applicables aux produits
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/ventes/remise/nouveau')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle Remise
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes les remises</SelectItem>
                <SelectItem value="actives">Actives</SelectItem>
                <SelectItem value="inactives">Inactives</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Items par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 par page</SelectItem>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {paginatedRemises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {remises.length === 0 ? 'Aucune remise disponible' : 'Aucune remise ne correspond aux critères'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRemises.map((remise) => (
                    <TableRow key={remise.id}>
                      <TableCell className="font-medium">{remise.code}</TableCell>
                      <TableCell>{remise.libelle}</TableCell>
                      <TableCell>
                        {remise.type_remise === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'}
                      </TableCell>
                      <TableCell>
                        {remise.type_remise === 'pourcentage' 
                          ? `${remise.valeur} %` 
                          : `${remise.valeur} DT`}
                      </TableCell>
                      <TableCell>
                        {formaterDate(remise.date_debut)} - {formaterDate(remise.date_fin)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={remise.est_active ? 'default' : 'secondary'}>
                          {remise.est_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => router.push(`/admin/ventes/remise/editer/${remise.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => handleSupprimerRemise(remise.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} remises
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}