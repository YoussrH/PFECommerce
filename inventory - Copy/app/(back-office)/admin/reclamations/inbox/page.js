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
import { MoreHorizontal, Eye, Archive, CheckCircle } from "lucide-react";
import { toast } from "sonner";
const staticData = [
  {
    id: "REC001",
    customer: "Ahmed Ben Salah",
    subject: "Produit défectueux",
    status: "Nouveau",
    date: "2025-05-01",
  },
  {
    id: "REC002",
    customer: "Fatima Zohra",
    subject: "Retard de livraison",
    status: "Non lu",
    date: "2025-05-02",
  },
  {
    id: "REC003",
    customer: "Mohamed Ali",
    subject: "Erreur de commande",
    status: "Nouveau",
    date: "2025-05-03",
  },
];

export default function ReclamationsInbox() {
 
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
        <CardTitle>Boîte de réception - Réclamations</CardTitle>
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
                  <Badge
                    variant={
                      reclamation.status === "Nouveau" ? "default" : "secondary"
                    }
                  >
                    {reclamation.status}
                  </Badge>
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
            Aucune réclamation dans la boîte de réception.
          </p>
        )}
      </CardContent>
    </Card>
  );
}