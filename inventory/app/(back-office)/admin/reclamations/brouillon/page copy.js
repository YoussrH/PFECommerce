"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DraftReclamations() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/reclamations/lister?statut=brouillon', {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setDrafts(data.data);
        } else {
          toast.error('Failed to fetch draft reclamations');
        }
      } catch (error) {
        console.error('Error fetching drafts:', error);
        toast.error('Failed to load draft reclamations');
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [token]);

  const handleDelete = async (id) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/reclamations/supprimer/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Réclamation supprimée');
        setDrafts(drafts.filter(draft => draft.id !== id));
      } else {
        toast.error(data.message || 'Failed to delete reclamation');
      }
    } catch (error) {
      console.error('Error deleting reclamation:', error);
      toast.error('Failed to delete reclamation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Réclamations en brouillon</CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réclamation en brouillon trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date de modification</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell>{draft.reference}</TableCell>
                    <TableCell>{draft.sujet}</TableCell>
                    <TableCell>{draft.prefix} {draft.prenom} {draft.nom}</TableCell>
                    <TableCell>
                      {format(new Date(draft.date_modification), 'PPpp', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Brouillon</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/reclamations/consulter/${draft.id}`)}
                      >
                        Continuer
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(draft.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}