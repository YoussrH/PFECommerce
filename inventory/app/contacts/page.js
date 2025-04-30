'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BreadcrumbArticle from '../components/Breadcrumb/BreadcrumbArticle';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const initialFormState = {
  prefix: '',
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  sujet: '',
  numeroCommande: '',
  message: '',
  fichiers: []
};

export default function ContactezNous() {
  const { user, loading, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        prefix: user.prefix || '',
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || ''
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, index) => {
    const files = [...formData.fichiers];
    if (e.target.files?.[0]) {
      files[index] = e.target.files[0];
    } else {
      files.splice(index, 1);
    }
    setFormData(prev => ({ ...prev, fichiers: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // Basic validation
    if (!formData.sujet || !formData.message || !formData.prenom || !formData.nom || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      
      // Add all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'fichiers' && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });
  
      // Add files
      formData.fichiers.forEach((file) => {
        if (file) {
          formDataToSend.append('fichiers', file);
        }
      });
  
      // Only include auth header if user is authenticated
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(isAuthenticated && token && { 'Authorization': `Bearer ${token}` })
        },
        withCredentials: true
      };
  
      const response = await axios.post(
        'http://localhost:5000/reclamations/creerReclamation',
        formDataToSend,
        config
      );
  
      if (response.data.success) {
        toast.success('Réclamation envoyée avec succès');
        setFormData(initialFormState);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.message || 
                 error.message || 
                 "Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <BreadcrumbArticle />
      <section className="p-6 max-w-4xl mx-auto text-xs md:text-sm text-gray-700 space-y-6">
        <h2 className="text-sm md:text-base font-semibold text-gray-800">
          Notre Guide d&apos;achat n&apos;a pas répondu à vos attentes ?
        </h2>

        {isAuthenticated && user && (
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="font-medium">Bonjour {user.prefix} {user.nom},</p>
            <p>Vos informations sont pré-remplies mais vous pouvez les modifier si nécessaire.</p>
          </div>
        )}

        <p>
          Notre équipe du Service Client est à votre entière disposition pour répondre à toutes vos questions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold">Préfixe*</Label>
            <RadioGroup 
              className="flex gap-6" 
              required
              value={formData.prefix}
              onValueChange={(value) => setFormData(prev => ({ ...prev, prefix: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Madame" id="madame" />
                <Label htmlFor="madame">Madame</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Monsieur" id="monsieur" />
                <Label htmlFor="monsieur">Monsieur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Mlle" id="Mlle" />
                <Label htmlFor="Mlle">Mlle</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prenom" className="font-semibold">Votre prénom*</Label>
              <Input 
                id="prenom" 
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required 
                className="border border-black rounded-none" 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nom" className="font-semibold">Votre nom*</Label>
              <Input 
                id="nom" 
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required 
                className="border border-black rounded-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="font-semibold">Votre email*</Label>
              <Input 
                id="email" 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required 
                className="border border-black rounded-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telephone" className="font-semibold">Votre téléphone</Label>
              <Input 
                id="telephone" 
                type="tel" 
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="border border-black rounded-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="sujet" className="font-semibold">Sujet*</Label>
              <Select 
                required
                value={formData.sujet}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sujet: value }))}
              >
                <SelectTrigger className="w-full border border-black rounded-none">
                  <SelectValue placeholder="Choisissez une option..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produits">Information sur les produits</SelectItem>
                  <SelectItem value="commande">Information sur ma commande</SelectItem>
                  <SelectItem value="retour">Information sur mes retours</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="numeroCommande" className="font-semibold">
                Numéro de commande (optionnel)
              </Label>
              <Input 
                id="numeroCommande" 
                name="numeroCommande"
                value={formData.numeroCommande}
                onChange={handleChange}
                className="border border-black rounded-none" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="message" className="font-semibold">Votre message*</Label>
            <Textarea 
              id="message" 
              rows={4} 
              name="message"
              value={formData.message}
              onChange={handleChange}
              required 
              className="border border-black rounded-none" 
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fichier1" className="font-semibold">
                Joindre un fichier (optionnel)
              </Label>
              <Input 
                type="file" 
                id="fichier1" 
                accept=".jpg,.jpeg,.png,.webp,.pdf" 
                onChange={(e) => handleFileChange(e, 0)}
                className="border border-black rounded-none" 
              />
              {formData.fichiers[0] && (
                <p className="text-xs text-gray-600 mt-1">Fichier sélectionné: {formData.fichiers[0].name}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fichier2" className="font-semibold">Joindre un autre fichier (optionnel)</Label>
              <Input 
                type="file" 
                id="fichier2" 
                accept=".jpg,.jpeg,.png,.webp,.pdf" 
                onChange={(e) => handleFileChange(e, 1)}
                className="border border-black rounded-none" 
              />
              {formData.fichiers[1] && (
                <p className="text-xs text-gray-600 mt-1">Fichier sélectionné: {formData.fichiers[1].name}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-black transition-colors duration-300 px-6 py-2"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </span>
              ) : 'Envoyer'}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}