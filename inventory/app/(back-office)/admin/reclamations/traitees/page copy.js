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

export default function ProcessedReclamations() {
  const [processed, setProcessed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchProcessed = async () => {
      try {
        setLoading(true);
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/reclamations/lister?statut=traite', {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setProcessed(data.data);
        } else {
          toast.error('Failed to fetch processed reclamations');
        }
      } catch (error) {
        console.error('Error fetching processed reclamations:', error);
        toast.error('Failed to load processed reclamations');
      } finally {
        setLoading(false);
      }
    };

    fetchProcessed();
  }, [token]);

  const handleArchive = async (id) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/reclamations/archiver/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Réclamation archivée');
        setProcessed(processed.filter(item => item.id !== id));
      } else {
        toast.error(data.message || 'Failed to archive reclamation');
      }
    } catch (error) {
      console.error('Error archiving reclamation:', error);
      toast.error('Failed to archive reclamation');
    }
  };

  const filteredProcessed = processed.filter(item =>
    item.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      return format(new Date(dateString), 'PPpp', { locale: fr });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // fallback to raw string if formatting fails
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
          <div className="flex justify-between items-center">
            <CardTitle>Réclamations traitées</CardTitle>
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
          {filteredProcessed.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réclamation traitée trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date de traitement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Résolution</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcessed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.reference}</TableCell>
                    <TableCell>{item.sujet}</TableCell>
                    <TableCell>{item.prefix} {item.prenom} {item.nom}</TableCell>
                    <TableCell>
                      {formatDate(item.date_reponse)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Traité</Badge>
                    </TableCell>
                    <TableCell>{item.resolution || 'Non spécifiée'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/reclamations/consulter/${item.id}`)}
                      >
                        Voir
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleArchive(item.id)}
                      >
                        Archiver
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