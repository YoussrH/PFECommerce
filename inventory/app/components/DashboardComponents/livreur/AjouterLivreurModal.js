// app/components/DashboardComponents/livreur/AjouterLivreurModal.js
'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { useAjouterLivreur } from '@/hooks/useLivreur'

export default function AjouterLivreurModal({ 
  isOpen, 
  onClose,
  onLivreurAdded 
}) {
  const { mutateAsync: ajouterLivreur, isLoading } = useAjouterLivreur()
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    mot_de_passe: '',
    telephone: '',
    type_vehicule: 'voiture',
    plaque_immatriculation: '',
    statut: 'actif'
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

  const validateTunisianPlate = (plate, vehicleType) => {
    if (!plate) return false;
    
    plate = plate.trim().toUpperCase().replace(/\s/g, '');
    
    const patterns = {
      voiture: /^(1\d{3}TU\d{3}|2\d{3}TU\d{3}|TU\d{4}|[A-Z]{2}\d{4}|[A-Z]{3}\d{3})$/,
      moto: /^(1\d{3}TU|2\d{3}TU|TU\d{4,5}|[A-Z]{1,2}\d{4,5})$/,
      velo: /^[A-Z]{1,2}\d{1,5}$/,
      camion: /^[A-Z]{2}\d{4}$/,
      remorque: /^R[A-Z]\d{4}$/
    };
    
    const regex = patterns[vehicleType] || /^[A-Z0-9]{1,10}$/;
    return regex.test(plate);
  }

  const getPlatePlaceholder = (vehicleType) => {
    switch(vehicleType) {
      case 'voiture': return 'Ex: 1234TU123 ou TU1234';
      case 'moto': return 'Ex: 1234TU ou TU1234';
      case 'velo': return 'Ex: A123';
      case 'camion': return 'Ex: AB1234';
      case 'remorque': return 'Ex: RA1234';
      default: return 'Entrez la plaque';
    }
  }

  const getPlateExamples = (vehicleType) => {
    switch(vehicleType) {
      case 'voiture': return 'Voiture: 1234TU123, 2000TU456, TU1234, AB1234, ABC123';
      case 'moto': return 'Moto: 1234TU, TU1234, A1234';
      case 'velo': return 'Vélo: A123, AB12';
      case 'camion': return 'Camion: AB1234';
      case 'remorque': return 'Remorque: RA1234';
      default: return 'Format attendu: 1-10 caractères alphanumériques';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateTunisianPlate(formData.plaque_immatriculation, formData.type_vehicule)) {
      toast.error(`Format de plaque d'immatriculation invalide. Exemples valides:\n${getPlateExamples(formData.type_vehicule)}`);
      return;
    }

    try {
      await ajouterLivreur(formData)
      toast.success('Livreur créé avec succès')
      onLivreurAdded()
      onClose()
      // Reset form after successful submission
      setFormData({
        email: '',
        nom: '',
        prenom: '',
        mot_de_passe: '',
        telephone: '',
        type_vehicule: 'voiture',
        plaque_immatriculation: '',
        statut: 'actif'
      })
    } catch (error) {
      console.error('Error creating livreur:', error)
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau livreur</DialogTitle>
          <DialogDescription>
            Remplissez les informations du livreur. Un email sera envoyé avec ses identifiants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mot_de_passe">Mot de passe</Label>
              <Input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleInputChange}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder={getPlatePlaceholder(formData.type_vehicule)}
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer livreur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}