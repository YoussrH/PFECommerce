"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Search, Edit, Trash2, Plus, MoreHorizontal } from "lucide-react";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { Label } from '@/components/ui/label';

export default function MarqueTable() {
  const { token } = useAuth();
  const router = useRouter();
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMarque, setCurrentMarque] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMarques = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/marques', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarques(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des marques');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      // Show toast confirmation
      toast.custom((t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-medium mb-4">Voulez-vous vraiment supprimer cette marque ?</p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                toast.dismiss(t);
                setDeletingId(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await axios.delete(`http://localhost:5000/marques/supprimerMarque/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setMarques(prev => prev.filter(marque => marque.id !== id));
                  toast.success('Marque supprimée avec succès');
                } catch (error) {
                  toast.error('Échec de la suppression');
                  console.error('Delete error:', error);
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </div>
      ), { duration: Infinity });
    } catch (error) {
      setDeletingId(null);
      console.error('Error showing confirmation:', error);
    }
  };

  const handleAddMarque = async (libelle) => {
    try {
      await axios.post(
        'http://localhost:5000/marques/ajouterMarque',
        { libelle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Marque ajoutée avec succès');
      setIsAddModalOpen(false);
      fetchMarques();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de l\'ajout de la marque');
      console.error('Add marque error:', error);
    }
  };

  const handleEditMarque = async (id, libelle) => {
    try {
      await axios.put(
        `http://localhost:5000/marques/mettreAJourMarque/${id}`,
        { libelle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Marque modifiée avec succès');
      setIsEditModalOpen(false);
      fetchMarques();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la modification de la marque');
      console.error('Edit marque error:', error);
    }
  };

  const filteredMarques = marques.filter(marque =>
    marque.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchMarques();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
          <div className="flex  mb-6 justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl">Gestion des marques</h1>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une marque
            </Button>
          </div>
      <Card>
        <CardHeader>

        </CardHeader>
        <CardContent>
          <div className="relative w-full max-w-md mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarques.length > 0 ? (
                    filteredMarques.map((marque) => (
                      <TableRow key={marque.id}>
                        <TableCell className="font-medium">
                          {marque.libelle}
                        </TableCell>
                        <TableCell>
                        {new Date(marque.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="font-sans">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setCurrentMarque(marque);
                                  setIsEditModalOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(marque.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                disabled={deletingId === marque.id}
                              >
                                {deletingId === marque.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        {searchTerm ? 'Aucune marque trouvée' : 'Aucune marque disponible'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Marque Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle marque</DialogTitle>
          </DialogHeader>
          <MarqueForm 
            onSubmit={handleAddMarque}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Marque Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la marque</DialogTitle>
          </DialogHeader>
          <MarqueForm 
            initialValues={currentMarque}
            onSubmit={(libelle) => handleEditMarque(currentMarque.id, libelle)}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarqueForm({ initialValues, onSubmit, onCancel }) {
  const [libelle, setLibelle] = useState(initialValues?.libelle || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setLibelle(initialValues.libelle);
    }
  }, [initialValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libelle.trim()) {
      toast.error("Le nom de la marque ne peut pas être vide.");
      return;
    }
  
    setLoading(true);
    try {
      await onSubmit(libelle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="libelle" className="text-right">
          Nom
        </Label>
        <Input
          id="libelle"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className="col-span-3"
          placeholder="Entrez le nom de la marque"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          type="button" 
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
            initialValues ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}