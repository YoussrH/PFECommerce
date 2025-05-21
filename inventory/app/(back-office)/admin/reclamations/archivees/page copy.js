"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ArchivedReclamations() {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        setLoading(true);
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/reclamations/lister?statut=archive', {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setArchived(data.data);
        } else {
          toast.error('Failed to fetch archived reclamations');
        }
      } catch (error) {
        console.error('Error fetching archived reclamations:', error);
        toast.error('Failed to load archived reclamations');
      } finally {
        setLoading(false);
      }
    };

    fetchArchived();
  }, [token]);

  const handleRestore = async (id) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/reclamations/restaurer/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Réclamation restaurée');
        setArchived(archived.filter(item => item.id !== id));
      } else {
        toast.error(data.message || 'Failed to restore reclamation');
      }
    } catch (error) {
      console.error('Error restoring reclamation:', error);
      toast.error('Failed to restore reclamation');
    }
  };

  const filteredArchived = archived.filter(item =>
    item.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex justify-between items-center">
            <CardTitle>Réclamations archivées</CardTitle>
            <div className="flex gap-2">
              <Input 
                placeholder="Rechercher..." 
                className="max-w-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline">Filtrer</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredArchived.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réclamation archivée trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Date clôture</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArchived.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.reference}</TableCell>
                    <TableCell>{item.sujet}</TableCell>
                    <TableCell>{item.prefix} {item.prenom} {item.nom}</TableCell>
                    <TableCell>
                      {format(new Date(item.date_creation), 'PP', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {item.date_reponse ? format(new Date(item.date_reponse), 'PP', { locale: fr }) : 'Non spécifiée'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Archivé</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/reclamations/consulter/${item.id}`)}
                      >
                        Consulter
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRestore(item.id)}
                      >
                        Restaurer
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