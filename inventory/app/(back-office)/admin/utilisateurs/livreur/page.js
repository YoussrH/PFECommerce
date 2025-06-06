'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Trash2, Edit, Truck, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'
import AjouterLivreurModal from '@/app/components/DashboardComponents/livreur/AjouterLivreurModal'
import LivreurDetailsModal from '@/app/components/DashboardComponents/livreur/LivreurDetailsModal'
import AssignerLivreurModal from '@/app/components/DashboardComponents/livreur/AssignerLivreurModal'
import { useUtilisateur } from '@/hooks/useUtilisateur'
import { useLivraison } from '@/hooks/useLivraison'

export default function LivreursPage() {
  const { user, token, isAdmin } = useAuth()
  const [livreurs, setLivreurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedLivreur, setSelectedLivreur] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [livreurLivraisons, setLivreurLivraisons] = useState([])
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDeactivatePrompt, setShowDeactivatePrompt] = useState(false)
  const [livreurToDeactivate, setLivreurToDeactivate] = useState(null)
  const [deactivationReason, setDeactivationReason] = useState('')
  const router = useRouter()

  const { 
    creeLivreur,
    mettreAJourLivreur,
    supprimerLivreur,
    obtenirTousLivreurs,
    activerLivreur,
    desactiverLivreur,
    loading: apiLoading,
    error: apiError,
    clearError
  } = useUtilisateur()

  const { 
    getLivraisonsParLivreur,
    loading: deliveryLoading,
    error: deliveryError,
    clearError: clearDeliveryError
  } = useLivraison()

  const fetchLivreurs = async () => {
    try {
      setLoading(true)
      clearError()
      const response = await obtenirTousLivreurs({ 
        page: currentPage, 
        limit: 10,
        search: searchTerm 
      }, token)
      
      if (response) {
        setLivreurs(response.data || [])
        setTotalPages(response.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching livreurs:', error)
      toast.error(error.message || 'Failed to fetch livreurs')
    } finally {
      setLoading(false)
    }
  }

  const fetchLivraisonsByLivreur = async (livreurId) => {
    try {
      setIsDeliveryLoading(true)
      clearDeliveryError()
      const data = await getLivraisonsParLivreur(livreurId, token)
      setLivreurLivraisons(data || [])
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      toast.error(error.message || 'Failed to fetch deliveries')
    } finally {
      setIsDeliveryLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchLivreurs()
    }
  }, [isAdmin, token, currentPage, searchTerm, refreshTrigger])

  const handleAddLivreur = async (livreurData) => {
    try {
      const newLivreur = await creeLivreur(livreurData, token)
      toast.success('Livreur créé avec succès')
      setIsAddModalOpen(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création du livreur')
    }
  }

  const handleUpdateLivreur = async (id, updates) => {
    try {
      setLivreurs(prev => prev.map(l => 
        l.utilisateur_id === id ? { ...l, ...updates } : l
      ))
      
      await mettreAJourLivreur(id, updates, token)
      toast.success('Livreur mis à jour avec succès')
      setRefreshTrigger(prev => prev + 1)
      
      if (selectedLivreur?.utilisateur_id === id) {
        fetchLivraisonsByLivreur(id)
      }
    } catch (error) {
      setLivreurs(prev => prev.map(l => 
        l.utilisateur_id === id ? { ...l, ...updates } : l
      ))
      toast.error(error.message || 'Erreur lors de la mise à jour du livreur')
    }
  }

  const handleDeleteLivreur = async (id) => {
    try {
      setLivreurs(prev => prev.filter(l => l.utilisateur_id !== id))
      
      await supprimerLivreur(id, token)
      toast.success('Livreur supprimé avec succès')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      setRefreshTrigger(prev => prev + 1)
      toast.error(error.message || 'Erreur lors de la suppression du livreur')
    }
  }

  const handleActivateLivreur = async (livreur) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [livreur.utilisateur_id]: true }))
      await activerLivreur(livreur.utilisateur_id, token)
      toast.success('Livreur activé avec succès')
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'activation du livreur")
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [livreur.utilisateur_id]: false }))
    }
  }

  const handleDeactivateLivreur = async () => {
    if (!livreurToDeactivate) return
    
    try {
      setUpdatingStatus(prev => ({ ...prev, [livreurToDeactivate.utilisateur_id]: true }))
      await desactiverLivreur(livreurToDeactivate.utilisateur_id, deactivationReason, token)
      toast.success('Livreur désactivé avec succès')
      setShowDeactivatePrompt(false)
      setLivreurToDeactivate(null)
      setDeactivationReason('')
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la désactivation du livreur')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [livreurToDeactivate.utilisateur_id]: false }))
    }
  }

  const promptDeactivateLivreur = (livreur) => {
    setLivreurToDeactivate(livreur)
    setShowDeactivatePrompt(true)
  }

  const handleViewDetails = async (livreur) => {
    setSelectedLivreur(livreur)
    setIsDetailsModalOpen(true)
    fetchLivraisonsByLivreur(livreur.utilisateur_id)
  }

  const handleAssignLivreur = (livreur) => {
    setSelectedLivreur(livreur)
    setIsAssignModalOpen(true)
  }

  const handleDeliveryAssigned = () => {
    if (selectedLivreur) {
      fetchLivraisonsByLivreur(selectedLivreur.utilisateur_id)
      setRefreshTrigger(prev => prev + 1)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Unauthorized access. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Deactivation Prompt */}
      {showDeactivatePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-black">
            <h3 className="text-lg font-bold mb-4">Désactiver Livreur</h3>
            <p className="mb-4">Voulez-vous vraiment désactiver ce livreur?</p>
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
                  setShowDeactivatePrompt(false)
                  setLivreurToDeactivate(null)
                  setDeactivationReason('')
                }}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeactivateLivreur}
                disabled={updatingStatus[livreurToDeactivate?.utilisateur_id]}
              >
                {updatingStatus[livreurToDeactivate?.utilisateur_id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Désactiver'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AjouterLivreurModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setRefreshTrigger(prev => prev + 1)
        }}
        onLivreurAdded={handleAddLivreur}
      />

      {selectedLivreur && (
        <>
          <LivreurDetailsModal
            livreur={selectedLivreur}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false)
              setSelectedLivreur(null)
              setRefreshTrigger(prev => prev + 1)
            }}
            onUpdate={handleUpdateLivreur}
            deliveries={livreurLivraisons}
            isLoading={isDeliveryLoading}
            onAssignDelivery={handleAssignLivreur}
          />
          
          <AssignerLivreurModal
            livreur={selectedLivreur}
            isOpen={isAssignModalOpen}
            onClose={() => {
              setIsAssignModalOpen(false)
              setSelectedLivreur(null)
              setRefreshTrigger(prev => prev + 1)
            }}
            onAssign={handleDeliveryAssigned}
          />
        </>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-6">Gestion des Livreurs</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Input
            placeholder="Rechercher un livreur..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full md:w-64"
          />
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>
    
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : livreurs.length === 0 ? (
        <div className="text-center py-8">
          <p>Aucun livreur trouvé</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border p-4 bg-white ">
            <CardTitle className="text-lg p-2">Liste des livreurs</CardTitle>

            <Table className="border p-6 ">
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Plaque</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Livraisons</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livreurs.map((livreur) => (
                  <TableRow key={livreur.utilisateur_id}>
                    <TableCell>
                      {livreur.utilisateur?.prenom} {livreur.utilisateur?.nom}
                    </TableCell>
                    <TableCell>{livreur.utilisateur?.email}</TableCell>
                    <TableCell>{livreur.telephone}</TableCell>
                    <TableCell>{livreur.type_vehicule}</TableCell>
                    <TableCell>{livreur.plaque_immatriculation}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                            livreur.utilisateur?.est_actif
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }
                          variant={livreur.utilisateur?.est_actif ? 'default' : 'secondary'}
                        >
                      
                        {updatingStatus[livreur.utilisateur_id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          livreur.utilisateur?.est_actif ? 'actif' : 'inactif'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {livreur.nombre_livraisons || 0} livraisons
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(livreur)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssignLivreur(livreur)}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Assigner livraison
                          </DropdownMenuItem>
                          {livreur.utilisateur?.est_actif ? (
                            <DropdownMenuItem
                              onClick={() => promptDeactivateLivreur(livreur)}
                              disabled={updatingStatus[livreur.utilisateur_id]}
                            >
                              {updatingStatus[livreur.utilisateur_id] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <span className="text-yellow-500 mr-2">🚫</span>
                                  Désactiver
                                </>
                              )}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleActivateLivreur(livreur)}
                              disabled={updatingStatus[livreur.utilisateur_id]}
                            >
                              {updatingStatus[livreur.utilisateur_id] ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <span className="text-green-500 mr-2">✅</span>
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteLivreur(livreur.utilisateur_id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}