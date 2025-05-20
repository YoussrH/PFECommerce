"use client";
import { useState, useEffect } from "react";
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
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";

export default function ReclamationsInbox() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();


  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelles Réclamations</CardTitle>
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
                <TableCell>{reclamation.prenom} {reclamation.nom}</TableCell>
                <TableCell>{reclamation.sujet}</TableCell>
                <TableCell>
                  <Badge variant="default">Nouveau</Badge>
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
                        onClick={() => handleAction("Voir", reclamation.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir et répondre
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction("Traiter", reclamation.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Traiter rapidement
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
            Aucune nouvelle réclamation. Tout est à jour!
          </p>
        )}
      </CardContent>
    </Card>
  );
}