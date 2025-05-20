"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useReclamations } from "@/hooks/useReclamations";
import { useEffect } from "react";

export default function ReclamationsArchivees() {
  const {
    reclamations,
    loading,
    fetchReclamations,
    restoreReclamation
  } = useReclamations();

  useEffect(() => {
    fetchReclamations('archive');
  }, [fetchReclamations]);

  const handleAction = async (action, reclamationId) => {
    try {
      if (action === "Voir") {
        // Use the hook's built-in functionality
        await fetchReclamationById(reclamationId);
      } else if (action === "Restaurer") {
        await restoreReclamation(reclamationId);
        toast.success("Réclamation restaurée avec succès");
        fetchReclamations('archive'); // Refresh the list
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réclamations Archivées</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date Archivage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reclamations.map((reclamation) => (
              <TableRow key={reclamation.id}>
                <TableCell>REC-{reclamation.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>{reclamation.prenom} {reclamation.nom}</TableCell>
                <TableCell>{reclamation.sujet}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Archivé</Badge>
                </TableCell>
                <TableCell>
                  {reclamation.date_modification 
                    ? new Date(reclamation.date_modification).toLocaleDateString() 
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleAction("Voir", reclamation.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction("Restaurer", reclamation.id)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restaurer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && reclamations.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            Aucune réclamation archivée.
          </p>
        )}
      </CardContent>
    </Card>
  );
}