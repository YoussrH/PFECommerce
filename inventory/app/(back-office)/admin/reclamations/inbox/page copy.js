"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

export default function ReclamationsInbox() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        setLoading(true);
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/reclamations/lister?statut=nouveau', {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setReclamations(data.data);
        } else {
          toast.error('Failed to fetch reclamations');
        }
      } catch (error) {
        console.error('Error fetching reclamations:', error);
        toast.error('Failed to load reclamations');
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, [token]);

  const filteredReclamations = reclamations.filter(reclamation =>
    reclamation.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reclamation.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parseFichiers = (fichiers) => {
    try {
      if (Array.isArray(fichiers)) return fichiers;
      if (typeof fichiers === 'string') return JSON.parse(fichiers);
      return [];
    } catch (e) {
      console.error('Error parsing fichiers:', e);
      return [];
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
            <CardTitle>Boîte de réception des réclamations</CardTitle>
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
          {filteredReclamations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réclamation trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Pièces jointes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReclamations.map((reclamation) => {
                  const fichiers = parseFichiers(reclamation.fichiers);
                  
                  return (
                    <TableRow key={reclamation.id}>
                      <TableCell>{reclamation.reference}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{reclamation.sujet}</TableCell>
                      <TableCell>
                        {reclamation.prefix} {reclamation.prenom} {reclamation.nom}
                      </TableCell>
                      <TableCell>{reclamation.email}</TableCell>
                      <TableCell>
                        {format(new Date(reclamation.date_creation), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {fichiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {fichiers.map((file, index) => (
                              <a 
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                {file.name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reclamation.statut === 'nouveau' ? 'destructive' : 'secondary'}>
                          {reclamation.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/admin/reclamations/consulter/${reclamation.id}`)}
                        >
                          Consulter
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}