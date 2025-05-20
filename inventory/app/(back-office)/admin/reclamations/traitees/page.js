"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Archive } from "lucide-react";
import { useReclamations } from "@/hooks/useReclamations";
import { toast } from "sonner";
import { useEffect } from "react";
export default function ReclamationsTraitees() {
  const { 
    reclamations, 
    loading, 
    fetchReclamations, 
    archiveReclamation,
    selectedReclamation,
    fetchReclamationById
  } = useReclamations();

  useEffect(() => {
    fetchReclamations('traite');
  }, [fetchReclamations]);

  const handleAction = async (action, reclamationId) => {
    try {
      if (action === "Voir") {
        await fetchReclamationById(reclamationId);
      } else if (action === "Archiver") {
        await archiveReclamation(reclamationId);
        toast.success("Réclamation archivée");
        fetchReclamations('traite'); // Refresh the list
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réclamations Traitées</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date Traitement</TableHead>
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
                  <Badge variant="success">Traité</Badge>
                </TableCell>
                <TableCell>
                  {reclamation.date_reponse 
                    ? new Date(reclamation.date_reponse).toLocaleDateString() 
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
                        onClick={() => handleAction("Archiver", reclamation.id)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archiver
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
            Aucune réclamation traitée récemment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}