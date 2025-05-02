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

const ClientsPage = () => {
  const { user, token, isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { 
    obtenirTousClients,
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

  // Auto-refresh when dependencies change
  useEffect(() => {
    if (isAdmin) {
      fetchClients()
    }
  }, [isAdmin, token, currentPage, searchTerm])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Accès non autorisé. Privilèges administrateur requis.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des clients</h1>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Rechercher des clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit">Rechercher</Button>
        </form>
      </div>

      {loading ? (
        <p>Chargement des clients...</p>
      ) : clients.length === 0 ? (
        <p>Aucun client trouvé</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Points de fidélité</TableHead>
                  <TableHead>Newsletter</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.utilisateur_id}>
                    <TableCell>
                      {client.utilisateur?.prenom} {client.utilisateur?.nom}
                    </TableCell>
                    <TableCell>{client.utilisateur?.email}</TableCell>
                    <TableCell>{client.telephone}</TableCell>
                    <TableCell>{client.points_fidelite || 0}</TableCell>
                    <TableCell>
                      {client.newsletter ? 'Abonné' : 'Non abonné'}
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4">
                      Page {currentPage} sur {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ClientsPage