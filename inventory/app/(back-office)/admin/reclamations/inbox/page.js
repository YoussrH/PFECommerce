"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { SearchIcon, FilterIcon, EyeIcon, PaperclipIcon } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

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
          toast.error('Impossible de récupérer les réclamations');
        }
      } catch (error) {
        console.error('Error fetching reclamations:', error);
        toast.error('Erreur lors du chargement des réclamations');
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, [token]);

  const filteredReclamations = reclamations.filter(reclamation =>
    reclamation.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reclamation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reclamation.reference?.toLowerCase().includes(searchTerm.toLowerCase())
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
    return <ReclamationsTableSkeleton />;
  }

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-medium">Nouvelles réclamations</h2>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 w-full sm:w-[250px]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filteredReclamations.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-secondary mb-4">
              <InboxIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Aucune réclamation</h3>
            <p className="text-muted-foreground">Votre boîte de réception est vide</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-medium">Référence</TableHead>
                  <TableHead className="font-medium">Sujet</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Pièces jointes</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReclamations.map((reclamation) => {
                  const fichiers = parseFichiers(reclamation.fichiers);
                  
                  return (
                    <TableRow key={reclamation.id} className="hover:bg-secondary/20">
                      <TableCell className="font-medium">{reclamation.reference}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{reclamation.sujet}</TableCell>
                      <TableCell>
                        {reclamation.prefix} {reclamation.prenom} {reclamation.nom}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reclamation.date_creation), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {fichiers.length > 0 ? (
                          <div className="flex items-center">
                            <PaperclipIcon className="h-4 w-4 mr-1" />
                            <span>{fichiers.length}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">
                          Nouveau
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => router.push(`/admin/reclamations/consulter/${reclamation.id}`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Consulter
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReclamationsTableSkeleton() {
  return (
    <Card className="border border-black  ">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function InboxIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
