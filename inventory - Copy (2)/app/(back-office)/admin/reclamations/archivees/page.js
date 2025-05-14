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
import { MoreHorizontal, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const staticData = [
  {
    id: "REC008",
    customer: "Amira Jendoubi",
    subject: "Produit endommagé",
    status: "Archivé",
    date: "2025-04-20",
  },
  {
    id: "REC009",
    customer: "Hichem Gharbi",
    subject: "Erreur de facturation",
    status: "Archivé",
    date: "2025-04-15",
  },
];

export default function ReclamationsArchivees() {
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
        <CardTitle>Réclamations Archivées</CardTitle>
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
                  <Badge variant="secondary">{reclamation.status}</Badge>
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
        {reclamations.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            Aucune réclamation archivée.
          </p>
        )}
      </CardContent>
    </Card>
  );
}