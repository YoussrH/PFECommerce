"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Eye, CheckCircle, Archive } from "lucide-react";
import { toast } from "sonner";

const staticData = [
  {
    id: "REC006",
    customer: "Leila Trabelsi",
    subject: "Demande de remboursement",
    status: "En attente",
    date: "2025-05-04",
  },
  {
    id: "REC007",
    customer: "Omar Chaabani",
    subject: "Problème de livraison",
    status: "En attente",
    date: "2025-05-05",
  },
];

export default function ReclamationsAttente() {
  const [reclamations, setReclamations] = useState(staticData);

  const handleAction = (action, reclamationId) => {
    toast({
      title: `${action} effectué`,
      description: `Action "${action}" appliquée à la réclamation ${reclamationId}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réclamations En Attente</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
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
                <TableCell>{reclamation.id}</TableCell>
                <TableCell>{reclamation.customer}</TableCell>
                <TableCell>{reclamation.subject}</TableCell>
                <TableCell>
                  <Badge variant="warning">{reclamation.status}</Badge>
                </TableCell>
                <TableCell>{reclamation.date}</TableCell>
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
                        onClick={() => handleAction("Traiter", reclamation.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marquer comme traité
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
        {reclamations.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            Aucune réclamation en attente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}