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
import { useUtilisateur } from '@/hooks/useUtilisateur'

export default function AjouterLivreurModal({ 
  isOpen, 
  onClose,
  onLivreurAdded 
}) {
  const { creeLivreur, loading, error, clearError } = useUtilisateur()
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    mot_de_passe: '',
    telephone: '',
    type_vehicule: 'voiture',
    plaque_immatriculation: '',
    statut: 'actif',
    capacite_max: 10,
    note_moyenne: 5,
    est_certifie: false
  })
  const [formErrors, setFormErrors] = useState({})

  const validateForm = () => {
    const errors = {}
    if (!formData.email?.trim()) errors.email = 'Email est requis'
    if (!formData.nom?.trim()) errors.nom = 'Nom est requis'
    if (!formData.prenom?.trim()) errors.prenom = 'Prénom est requis'
    if (!formData.mot_de_passe || formData.mot_de_passe.length < 8) {
      errors.mot_de_passe = 'Mot de passe doit contenir au moins 8 caractères'
    }
    if (!formData.telephone?.trim()) errors.telephone = 'Téléphone est requis'
    if (!formData.plaque_immatriculation?.trim()) {
      errors.plaque_immatriculation = 'Plaque d\'immatriculation est requise'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
  
    try {
      clearError();
      
      const livreurData = {
        email: formData.email.trim(),
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        mot_de_passe: formData.mot_de_passe,
        telephone: formData.telephone.trim(),
        type_vehicule: formData.type_vehicule,
        plaque_immatriculation: formData.plaque_immatriculation.trim(),
        statut: formData.statut,
        capacite_max: formData.capacite_max,
        note_moyenne: formData.note_moyenne,
        est_certifie: formData.est_certifie
      };
  
      const result = await creeLivreur(livreurData);
      
      // If we get here, the request was successful
      toast.success('Livreur créé avec succès');
      onLivreurAdded(result);
      onClose();
      
      // Reset form
      setFormData({
        email: '',
        nom: '',
        prenom: '',
        mot_de_passe: '',
        telephone: '',
        type_vehicule: 'voiture',
        plaque_immatriculation: '',
        statut: 'actif',
        capacite_max: 10,
        note_moyenne: 5,
        est_certifie: false
      });
  
    } catch (error) {
      console.error('Creation error:', error);
      // Only show error if it's not about email sending
      if (!error.message.includes('Email sending failed')) {
        toast.error(error.message || 'Erreur lors de la création');
      } else {
        // Still show success but mention email issue
        toast.success('Livreur créé mais échec d\'envoi d\'email');
        onLivreurAdded();
        onClose();
      }
    }
  };

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
          <div className="grid gap-4 py-4"></div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom*</Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.nom && <p className="text-red-500 text-xs">{formErrors.nom}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom*</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.prenom && <p className="text-red-500 text-xs">{formErrors.prenom}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mot_de_passe">Mot de passe*</Label>
              <Input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleInputChange}
                required
                minLength={8}
              />
              {formErrors.mot_de_passe && <p className="text-red-500 text-xs">{formErrors.mot_de_passe}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone*</Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleInputChange}
                required
              />
              {formErrors.telephone && <p className="text-red-500 text-xs">{formErrors.telephone}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type_vehicule">Type de véhicule*</Label>
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
                <Label htmlFor="plaque_immatriculation">Plaque d&apos;immatriculation*</Label>
                <Input
                  id="plaque_immatriculation"
                  name="plaque_immatriculation"
                  value={formData.plaque_immatriculation}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.plaque_immatriculation && <p className="text-red-500 text-xs">{formErrors.plaque_immatriculation}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut*</Label>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer livreur'}
            </Button>
          </DialogFooter>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  )
}