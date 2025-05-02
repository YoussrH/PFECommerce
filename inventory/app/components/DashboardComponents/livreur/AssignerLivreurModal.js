'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useLivraison } from '@/hooks/useLivraison'

export default function AssignerLivreurModal({
  livreur,
  isOpen,
  onClose,
  onAssign
}) {
  const [selectedLivraison, setSelectedLivraison] = useState('')
  const { 
    loading, 
    error,
    getLivraisonsDisponibles,
    assignerLivraison,
    clearError
  } = useLivraison()
  const [livraisonsDisponibles, setLivraisonsDisponibles] = useState([])
  const [fetching, setFetching] = useState(false)

  const handleAssign = async () => {
    if (!selectedLivraison) {
      toast.error('Veuillez sélectionner une livraison')
      return
    }

    try {
      await assignerLivraison(selectedLivraison, livreur.utilisateur_id)
      toast.success('Livraison assignée avec succès')
      onAssign()
      onClose()
      setSelectedLivraison('')
    } catch (error) {
      console.error('Error assigning delivery:', error)
      toast.error(error.message || 'Erreur lors de l\'assignation')
    }
  }

  const fetchLivraisonsDisponibles = async () => {
    try {
      setFetching(true)
      clearError()
      const data = await getLivraisonsDisponibles()
      setLivraisonsDisponibles(data || [])
    } catch (error) {
      console.error('Error fetching available deliveries:', error)
      toast.error(error.message || 'Erreur lors de la récupération des livraisons')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLivraisonsDisponibles()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assigner une livraison à {livreur?.utilisateur?.prenom} {livreur?.utilisateur?.nom}</DialogTitle>
          <DialogDescription>
            Sélectionnez une livraison disponible à assigner à ce livreur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Livreur</Label>
            <div className="flex items-center gap-2 p-2 border rounded">
              <span>{livreur?.utilisateur?.prenom} {livreur?.utilisateur?.nom}</span>
              <Badge variant="outline">{livreur?.type_vehicule}</Badge>
              <Badge variant={livreur?.statut === 'actif' ? 'default' : 'secondary'}>
                {livreur?.statut}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Livraisons disponibles</Label>
            {fetching ? (
              <div className="p-4 text-center">Chargement des livraisons...</div>
            ) : livraisonsDisponibles.length === 0 ? (
              <div className="p-4 text-center">Aucune livraison disponible</div>
            ) : (
              <Select 
                value={selectedLivraison}
                onValueChange={setSelectedLivraison}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une livraison" />
                </SelectTrigger>
                <SelectContent>
                  {livraisonsDisponibles.map((livraison) => (
                    <SelectItem 
                      key={livraison.livraison_id} 
                      value={livraison.livraison_id}
                    >
                      #{livraison.reference} - {livraison.adresse_livraison} - {new Date(livraison.date_creation).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={loading || livraisonsDisponibles.length === 0 || !selectedLivraison}
            >
              {loading ? 'Assignation...' : 'Assigner'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}