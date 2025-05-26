"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, AlertCircleIcon, PackageOpenIcon, RefreshCwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCommandes,
  useCancelCommande,
  useGenerateInvoice,
} from "@/hooks/useCommandes";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statusOptions = [

  { value: "en_preparation", label: "En préparation", color: "bg-purple-500" },
  { value: "expediee", label: "Expédiée", color: "bg-orange-500" },
  { value: "livree", label: "Livrée", color: "bg-green-500" },
  { value: "remplacee", label: "Remplacée", color: "bg-blue-500" },
  { value: "retourne", label: "Retournée", color: "bg-red-800" },
  
  { value: "annulee", label: "Annulée", color: "bg-red-500" },
];

export default function CommandesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const { data, isLoading, isError, refetch } = useCommandes({
    page,
    limit,
    search,
    statut: statusFilter === "tous" ? undefined : statusFilter,
  });

  const cancelCommandeMutation = useCancelCommande();
  const generateInvoiceMutation = useGenerateInvoice();

  const handleCancelCommande = async (commandeId) => {
    try {
      await cancelCommandeMutation.mutateAsync({
        id: commandeId,
        raison: "Annulée par l'administrateur",
        rembourser: true,
      });
      toast.success("Commande annulée avec succès");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la commande");
    }
  
  };

  const handleGenerateInvoice = async (commandeId) => {
    try {
      await generateInvoiceMutation.mutateAsync(commandeId);
      toast.success("Facture générée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération de la facture");
    }
  };

  const handleViewDetails = (commandeId) => {
    router.push(`/admin/ventes/commandes/gerer/${commandeId}`);
  };

  const totalPages = Math.ceil((data?.total || 0) / limit);
  console.log("[CommandesPage] Pagination info:", { totalPages, currentPage: page });

  if (isLoading) {
    console.log("[CommandesPage] Rendering loading state");
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 w-full md:w-[300px]" />
          <Skeleton className="h-10 w-full md:w-[180px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    console.error("[CommandesPage] Rendering error state");
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4 p-4">
        <AlertCircleIcon className="h-12 w-12 text-red-500" />
        <h3 className="text-xl font-medium">Erreur de chargement</h3>
        <p className="text-muted-foreground text-center">
          Impossible de charger les commandes. Veuillez réessayer.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (data?.commandes?.length === 0) {
    console.log("[CommandesPage] Rendering empty state");
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4 p-4">
        <PackageOpenIcon className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-medium">Aucune commande trouvée</h3>
        <p className="text-muted-foreground text-center">
          {search || statusFilter !== "tous"
            ? "Essayez de modifier vos critères de recherche"
            : "Aucune commande n'a été passée pour le moment"}
        </p>
        {(search || statusFilter !== "tous") && (
          <Button variant="outline" onClick={() => {
            setSearch("");
            setStatusFilter("tous");
          }}>
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    );
  }

  console.log("[CommandesPage] Rendering commandes list with data");
  return (
    <div className="space-y-6 p-4  ">
             <h1 className="text-2xl font-bold font-mono ">Gestion des Commandes</h1>
<div className="bg-white p-6 rounded-xl shadow-md">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-4  md:w-auto">
          <Input
            placeholder="Rechercher par référence ou client..."
            className="w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border p-5  overflow-x-auto">
        <Table className="min-w-[800px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Référence</TableHead>
              <TableHead className="min-w-[150px]">Client</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[100px]">Montant</TableHead>
              <TableHead className="min-w-[120px]">Statut</TableHead>
              <TableHead className="min-w-[120px]">Livraison</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.commandes?.map((commande) => (
              <TableRow key={commande.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/admin/ventes/commandes/gerer/${commande.id}`}
                    className="hover:underline text-primary"
                  >
                    {commande.reference}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="line-clamp-1">
                    {commande.client?.utilisateur?.prenom} {commande.client?.utilisateur?.nom}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>{commande.prix_total.toFixed(2)} DT</TableCell>
                <TableCell>
                  <Badge className={`${statusOptions.find(s => s.value === commande.statut)?.color} text-white`}>
                    {statusOptions.find(s => s.value === commande.statut)?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {commande.details_livraison?.fee} DT ({commande.methode_livraison === 'express' ? 'Express' : 'Standard'})
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(commande.id)}>
                        Gérer la commande
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateInvoice(commande.id)}>
                        Générer facture
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleCancelCommande(commande.id)}
                        disabled={commande.statut === 'annulee' || commande.statut === 'livree'}
                      >
                        Annuler commande
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

     </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => {
                  console.log("[CommandesPage] Previous page clicked");
                  setPage((prev) => Math.max(prev - 1, 1));
                }} 
                disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNumber = page <= 3 ? i + 1 : 
                              page >= totalPages - 2 ? totalPages - 4 + i :
                              page - 2 + i;
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={page === pageNumber}
                    onClick={() => {
                      console.log(`[CommandesPage] Page ${pageNumber} clicked`);
                      setPage(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext 
                onClick={() => {
                  console.log("[CommandesPage] Next page clicked");
                  setPage((prev) => Math.min(prev + 1, totalPages));
                }} 
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}