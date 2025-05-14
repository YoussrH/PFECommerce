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
import { MoreHorizontal, Eye, Archive } from "lucide-react";
import { toast } from "sonner";

const staticData = [
  {
    id: "REC004",
    customer: "Sana Belhadj",
    subject: "Problème de facturation",
    status: "Traité",
    date: "2025-04-28",
  },
  {
    id: "REC005",
    customer: "Karim Mhamdi",
    subject: "Produit non conforme",
    status: "Traité",
    date: "2025-04-27",
  },
];

export default function ReclamationsTraitees() {
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
        <CardTitle>Réclamations Traitées</CardTitle>
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
                  <Badge variant="success">{reclamation.status}</Badge>
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
            Aucune réclamation traitée.
          </p>
        )}
      </CardContent>
    </Card>
  );
}