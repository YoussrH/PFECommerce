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
import { FileIcon, ImageIcon, DownloadIcon, X } from 'lucide-react';

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
    const newFiles = Array.from(e.target.files);
    
    // Validate files
    const validFiles = newFiles.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux (max 5MB): ${file.name}`);
        return false;
      }
      return true;
    });

    // Replace or add files based on index
    if (index >= 0) {
      if (validFiles[0]) files[index] = validFiles[0];
    } else {
      files.push(...validFiles);
    }

    setFormData(prev => ({ ...prev, fichiers: files }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file, index) => {
    try {
      // For files not yet uploaded (in form state)
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // For already uploaded files (from Cloudinary)
      if (file.url?.includes('res.cloudinary.com')) {
        // Force download by adding fl_attachment parameter
        const downloadUrl = file.url.includes('fl_attachment') 
          ? file.url 
          : file.url.replace('/upload/', '/upload/fl_attachment/');
        
        if (file.type === 'application/pdf') {
          window.open(downloadUrl, '_blank');
        } else {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Échec du téléchargement: ${file.name || 'fichier'}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Enhanced validation
    const requiredFields = ['prefix', 'prenom', 'nom', 'email', 'sujet', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Veuillez remplir tous les champs obligatoires`);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Map frontend field names to backend expected names
      formDataToSend.append('prefix', formData.prefix);
      formDataToSend.append('prenom', formData.prenom);
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telephone', formData.telephone || '');
      formDataToSend.append('sujet', formData.sujet);
      formDataToSend.append('numeroCommande', formData.numeroCommande || '');
      formDataToSend.append('message', formData.message);

      // Handle file uploads
      formData.fichiers.forEach((file) => {
        if (file) {
          formDataToSend.append('fichiers', file);
        }
      });

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
      let errorMessage = error.response?.data?.message || error.message;
      
      // Handle specific backend validation errors
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join(', ');
      }
      
      toast.error(errorMessage || "Erreur lors de l'envoi");
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
                  <SelectItem value="remplacement">Demande de remplacement</SelectItem>
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
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required 
              className="border border-black rounded-none" 
            />
          </div>

          {/* <div className="space-y-4">
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
                <div className="flex items-center gap-2 mt-1">
                  {formData.fichiers[0].type?.includes('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                  <span className="text-xs text-gray-600">
                    {formData.fichiers[0].name} ({formatFileSize(formData.fichiers[0].size)})
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleDownload(formData.fichiers[0], 0)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newFiles = [...formData.fichiers];
                      newFiles.splice(0, 1);
                      setFormData(prev => ({ ...prev, fichiers: newFiles }));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
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
                <div className="flex items-center gap-2 mt-1">
                  {formData.fichiers[1].type?.includes('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                  <span className="text-xs text-gray-600">
                    {formData.fichiers[1].name} ({formatFileSize(formData.fichiers[1].size)})
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleDownload(formData.fichiers[1], 1)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newFiles = [...formData.fichiers];
                      newFiles.splice(1, 1);
                      setFormData(prev => ({ ...prev, fichiers: newFiles }));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div> */}

  <div className="space-y-1">
            <Label htmlFor="file-upload" className="font-semibold">
              Joindre des fichiers (optionnel, max 3)
            </Label>
            <Input 
              type="file" 
              id="file-upload"
              accept=".jpg,.jpeg,.png,.webp,.pdf" 
              onChange={handleFileChange}
              className="border border-black rounded-none" 
              multiple
            />
            {formData.fichiers.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.fichiers.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {file.type?.includes('image/') ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs text-gray-600">
                      {file.name} ({formatFileSize(file.size)})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleDownload(file, index)}
                      className="text-blue-500 hover:text-blue-700 ml-auto"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newFiles = [...formData.fichiers];
                        newFiles.splice(index, 1);
                        setFormData(prev => ({ ...prev, fichiers: newFiles }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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