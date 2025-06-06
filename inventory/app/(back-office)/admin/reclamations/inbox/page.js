"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { SearchIcon, FilterIcon, EyeIcon, PaperclipIcon, InboxIcon } from 'lucide-react'; // Ensure InboxIcon is imported if custom or remove if not needed.
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
    <div className="p-2 -ml-4 md:p-8 lg:p-10"> {/* Added responsive padding */}
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Boîte de Réception des Réclamations</h1> {/* Enhanced heading */}

      <Card className="shadow-lg w-screen max-w-7xl  border-gray-100 rounded-xl"> {/* Enhanced card styling */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6"> {/* Added header for consistent padding */}
          <CardTitle className="text-xl font-semibold text-gray-800">Nouvelles Réclamations</CardTitle> {/* Card title for clarity */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow"> {/* Added flex-grow for better search bar scaling */}
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 w-full min-w-[200px] md:w-[300px] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded-md">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0"> {/* Adjusted padding */}
          {filteredReclamations.length === 0 ? (
            <div className="text-center rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center"> {/* Refined empty state */}
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                <InboxIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Aucune nouvelle réclamation</h3>
              <p className="text-gray-500 max-w-sm">
                C&apos;est calme ici ! Toutes les nouvelles réclamations apparaîtront dans cette section.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200"> {/* Added border to table container */}
              <Table className="min-w-full divide-y divide-gray-200"> {/* Ensured table takes full width */}
                <TableHeader className="bg-gray-50"> {/* Light background for header */}
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièces jointes</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-100">
                  {filteredReclamations.map((reclamation) => {
                    const fichiers = parseFichiers(reclamation.fichiers);

                    return (
                      <TableRow key={reclamation.id} className="hover:bg-gray-50 transition-colors duration-150"> {/* Subtle hover effect */}
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reclamation.reference}</TableCell>
                        <TableCell className="px-6 py-4 max-w-[250px] truncate text-sm text-gray-700">{reclamation.sujet}</TableCell> {/* Increased max-width */}
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {reclamation.prefix} {reclamation.prenom} {reclamation.nom}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(reclamation.date_creation), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {fichiers.length > 0 ? (
                            <div className="flex items-center text-blue-600"> {/* Emphasize attachments */}
                              <PaperclipIcon className="h-4 w-4 mr-1" />
                              <span>{fichiers.length}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="destructive" className="bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full"> {/* More refined badge */}
                            Nouveau
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
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
    </div>
  );
}

function ReclamationsTableSkeleton() {
  return (
    <div className=" mx-auto p-6 md:p-8 lg:p-10">
      <Skeleton className="h-10 w-96 mb-8 rounded-md" /> {/* Skeleton for the main heading */}
      <Card className="shadow-lg border-gray-100 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
          <Skeleton className="h-8 w-64" /> {/* Skeleton for card title */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[300px]" /> {/* Skeleton for search input */}
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Skeleton for filter button */}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => ( // Show 5 skeleton rows
              <div key={i} className="grid grid-cols-7 gap-4 items-center py-4 px-6 border-b border-gray-100 last:border-b-0">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Ensure InboxIcon is defined or imported from 'lucide-react'
// If it's a custom icon, keep its definition as is or move it to a separate components file.
// For this example, I've assumed it's part of lucide-react, so I've added it to the import.
// If it's custom and not used anywhere else, you can keep the local definition.
// function InboxIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
//       <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
//     </svg>
//   );
// }