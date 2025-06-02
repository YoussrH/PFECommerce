'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useAuth } from '@/app/contexts/AuthContext'
import { useUtilisateur } from '@/hooks/useUtilisateur'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"

const ClientsPage = () => {
  const { user, token, isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [clientToToggle, setClientToToggle] = useState(null)
  const [deactivationReason, setDeactivationReason] = useState('')
  const [processingStatus, setProcessingStatus] = useState({}) // Track processing status per client

  const { 
    obtenirTousClients,
    desactiverUtilisateur,
    reactiverUtilisateur,
    loading: apiLoading,
    error: apiError,
    clearError
  } = useUtilisateur()

  const fetchClients = async () => {
    try {
      setLoading(true)
      clearError()
      
      const response = await obtenirTousClients({ 
        page: currentPage,
        limit: 10,
        search: searchTerm
      }, token)

      if (response) {
        setClients(response.data || [])
        setTotalPages(response.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients :', error)
      toast.error(error.message || 'Échec de la récupération des clients')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleClick = (clientId, isActive) => {
    setClientToToggle({ id: clientId, isActive })
    if (isActive) {
      setShowDeactivateDialog(true)
    } else {
      toggleAccountStatus(false)
    }
  }

  const toggleAccountStatus = async (shouldDeactivate) => {
    if (!clientToToggle) return
    
    try {
      setProcessingStatus(prev => ({ ...prev, [clientToToggle.id]: true }))
      
      if (shouldDeactivate) {
        await desactiverUtilisateur(clientToToggle.id, deactivationReason, token)
        toast.success('Compte désactivé avec succès')
      } else {
        await reactiverUtilisateur(clientToToggle.id, token)
        toast.success('Compte réactivé avec succès')
      }
      fetchClients()
    } catch (error) {
      console.error('Error toggling account status:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du statut')
    } finally {
      setProcessingStatus(prev => ({ ...prev, [clientToToggle.id]: false }))
      setShowDeactivateDialog(false)
      setClientToToggle(null)
      setDeactivationReason('')
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchClients()
    }
  }, [isAdmin, token, currentPage, searchTerm])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Privilèges administrateur requis pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Deactivation Dialog */}
      {showDeactivateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-black">
            <h3 className="text-lg font-bold mb-4">Désactiver Compte</h3>
            <p className="mb-4">Voulez-vous vraiment désactiver ce compte client?</p>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium mb-2">
                Raison (optionnelle)
              </label>
              <Input
                id="reason"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Entrez la raison de la désactivation"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeactivateDialog(false)
                  setDeactivationReason('')
                }}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={() => toggleAccountStatus(true)}
                disabled={apiLoading}
              >
                {apiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Désactiver'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestion des clients</h1>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher des clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun client trouvé</p>
              {searchTerm && (
                <Button variant="ghost" onClick={() => setSearchTerm('')}>
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Newsletter</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.utilisateur_id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {client.utilisateur?.prenom} {client.utilisateur?.nom}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.utilisateur?.email}
                        </TableCell>
                        <TableCell>{client.telephone}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {client.points_fidelite || 0} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.utilisateur?.est_actif ? "default" : "destructive"}>
                            {processingStatus[client.utilisateur_id] ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {client.utilisateur?.est_actif ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.newsletter ? "default" : "secondary"}>
                            {client.newsletter ? 'Abonné' : 'Non abonné'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={client.utilisateur?.est_actif ? "destructive" : "default"}
                            onClick={() => handleToggleClick(client.utilisateur_id, client.utilisateur?.est_actif)}
                            disabled={processingStatus[client.utilisateur_id]}
                          >
                            {processingStatus[client.utilisateur_id] ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {client.utilisateur?.est_actif ? 'Désactiver' : 'Activer'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4 text-sm text-muted-foreground">
                          Page {currentPage} sur {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientsPage