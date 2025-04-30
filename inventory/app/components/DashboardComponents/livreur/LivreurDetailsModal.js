// app/components/DashboardComponents/livreur/LivreurDetailsModal.js
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Truck } from 'lucide-react'

export default function LivreurDetailsModal({
  livreur,
  isOpen,
  onClose,
  onUpdate,
  deliveries,
  isLoading,
  onAssignDelivery
}) {
  const [formData, setFormData] = useState({
    telephone: livreur?.telephone || '',
    type_vehicule: livreur?.type_vehicule || 'voiture',
    plaque_immatriculation: livreur?.plaque_immatriculation || '',
    statut: livreur?.statut || 'actif'
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await onUpdate(livreur.utilisateur_id, formData)
      toast.success('Livreur mis à jour avec succès')
      onClose()
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Détails du livreur</DialogTitle>
          <DialogDescription>
            {livreur?.utilisateur?.prenom} {livreur?.utilisateur?.nom}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <p className="p-2 border rounded">
                  {livreur?.utilisateur?.prenom} {livreur?.utilisateur?.nom}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="p-2 border rounded">
                  {livreur?.utilisateur?.email}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type_vehicule">Type de véhicule</Label>
                <Select
                  value={formData.type_vehicule}
                  onValueChange={(value) => handleSelectChange('type_vehicule', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voiture">Voiture</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="velo">Vélo</SelectItem>
                    <SelectItem value="camion">Camion</SelectItem>
                    <SelectItem value="remorque">Remorque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plaque_immatriculation">Plaque d&apos;immatriculation</Label>
                <Input
                  id="plaque_immatriculation"
                  name="plaque_immatriculation"
                  value={formData.plaque_immatriculation}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => handleSelectChange('statut', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Livraisons assignées</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAssignDelivery(livreur)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Assigner une livraison
                </Button>
              </div>
              
              {isLoading ? (
                <div className="p-4 text-center">Chargement des livraisons...</div>
              ) : deliveries.length === 0 ? (
                <div className="p-4 text-center">Aucune livraison assignée</div>
              ) : (
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Adresse</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map((delivery) => (
                        <TableRow key={delivery.livraison_id}>
                          <TableCell>#{delivery.reference}</TableCell>
                          <TableCell>
                            {new Date(delivery.date_creation).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{delivery.adresse_livraison}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {delivery.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}