"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Trash2, User, History } from "lucide-react";
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Personnel() {
  const { user, isAdmin, token } = useAuth();
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    prefix: '',
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'admin',
    newsletter: false
  });
  const [errors, setErrors] = useState({});

  const initialFormState = {
    prefix: '',
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'admin',
    newsletter: false
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!formData.mot_de_passe || formData.mot_de_passe.length < 8) {
      newErrors.mot_de_passe = "Le mot de passe doit contenir au moins 8 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/admin/personnel', {
        headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
      });
  
      setPersonnel(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      toast.error(error.response?.data?.message || 'Échec du chargement du personnel');
      setPersonnel([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPersonnel();
    }
  }, [isAdmin, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleCreateAdmin = async () => {
    if (!validateForm()) return;
  
    try {
      setIsCreating(true);
      const endpoint = formData.role === 'super_admin' 
        ? 'http://localhost:5000/admin/creer-super-admin' 
        : 'http://localhost:5000/admin/creer-admin';
  
      const response = await fetch(endpoint, {
        method: 'POST',
         headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        body: JSON.stringify({
          prefix: formData.prefix,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          mot_de_passe: formData.mot_de_passe,
          newsletter: formData.newsletter
        }),
        credentials: 'include'
      });
  
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Request failed');
  
      toast.success(data.message);
      setOpenDialog(false);
      setFormData(initialFormState);
      fetchPersonnel();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };
  
  const canDeleteUser = (targetUser) => {
    if (!user || user.role !== 'super_admin') {
      return false;
    }
    // Only allow deletion if:
    // 1. Not deleting yourself
    // 2. The target user was created by the current user
    return targetUser.id !== user.id && targetUser.created_by === user.id;
  };
  
  const handleDeleteAdmin = async (id) => {
    try {
      setIsDeleting(id);
      const response = await fetch(`http://localhost:5000/admin/supprimer-admin/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        credentials: 'include'
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.message || 'Échec de la suppression');
      }
      
      toast.success(data.message);
      fetchPersonnel();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };




  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">Les privilèges d&apos;administrateur sont requis pour accéder à cette page</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion du personnel</CardTitle>
          <div className="flex gap-2">
            <Link href="/admin/users/historique" passHref>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Voir l&apos;historique
              </Button>
            </Link>
            {user?.role === 'super_admin' && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un administrateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel administrateur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Préfixe</label>
                        <Input
                          name="prefix"
                          value={formData.prefix}
                          onChange={handleInputChange}
                          placeholder="Monsieur/Madame/Mlle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rôle</label>
                        <Select 
                          onValueChange={handleRoleChange} 
                          value={formData.role}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            {user?.role === 'super_admin' && (
                              <SelectItem value="super_admin">Super Administrateur</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Prénom</label>
                      <Input
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.prenom && <p className="text-sm text-red-500 mt-1">{errors.prenom}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom</label>
                      <Input
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Mot de passe</label>
                      <Input
                        type="password"
                        name="mot_de_passe"
                        value={formData.mot_de_passe}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                      />
                      {errors.mot_de_passe && <p className="text-sm text-red-500 mt-1">{errors.mot_de_passe}</p>}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="newsletter"
                        name="newsletter"
                        checked={formData.newsletter}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                      <label htmlFor="newsletter" className="text-sm font-medium">
                        S&apos;abonner à la newsletter
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleCreateAdmin} 
                      disabled={isCreating}
                      className="w-full"
                    >
                      {isCreating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : 'Créer un administrateur'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
      <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : personnel.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      {person.prefix} {person.prenom} {person.nom}
                    </TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        person.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {person.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {person.creator ? `${person.creator.prenom} ${person.creator.nom}` : 'Système'}
                    </TableCell>
                    <TableCell>
                      {person.created_at ? new Date(person.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {person.id === user.id ? (
                        <Link href="/account" passHref>
                          <Button variant="ghost" size="sm">
                            <User className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => canDeleteUser(person) && handleDeleteAdmin(person.id)}
                                  disabled={!canDeleteUser(person) || isDeleting === person.id}
                                >
                                  {isDeleting === person.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!canDeleteUser(person) && (
                              <TooltipContent>
                                <p>Vous n&apos;avez pas les permissions nécessaires pour supprimer cet utilisateur</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Aucun personnel administratif trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}