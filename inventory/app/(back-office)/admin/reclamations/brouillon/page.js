"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useReclamations } from "@/hooks/useReclamations";
import { useEffect } from "react";

export default function ReclamationsBrouillon() {
  const {
    reclamations,
    loading,
    fetchReclamations,
    respondToReclamation,
    archiveReclamation
  } = useReclamations();

  useEffect(() => {
    fetchReclamations('brouillon');
  }, [fetchReclamations]);

  const handleAction = async (action, reclamationId) => {
    try {
      if (action === "Traiter") {
        await respondToReclamation(
          reclamationId, 
          "[Réponse automatique - Complétez cette réponse]"
        );
        toast.success("Réclamation marquée comme traitée");
        fetchReclamations('brouillon'); // Refresh the list
      } else if (action === "Archiver") {
        await archiveReclamation(reclamationId);
        toast.success("Brouillon archivé");
        fetchReclamations('brouillon'); // Refresh the list
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brouillons de Réponses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reclamations.map((reclamation) => (
              <TableRow key={reclamation.id}>
                <TableCell>REC-{reclamation.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>
                  {reclamation.prenom} {reclamation.nom}
                </TableCell>
                <TableCell>{reclamation.sujet}</TableCell>
                <TableCell>
                  <Badge variant="warning">Brouillon</Badge>
                </TableCell>
                <TableCell>
                  {new Date(reclamation.date_creation).toLocaleDateString()}
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
                        onClick={() => handleAction("Traiter", reclamation.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finaliser et marquer comme traité
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction("Archiver", reclamation.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archiver le brouillon
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
            Aucun brouillon de réponse en attente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}