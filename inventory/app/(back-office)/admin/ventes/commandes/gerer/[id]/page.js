'use client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeftIcon,
  DownloadIcon,
  MailIcon,
  PrinterIcon,
  RefreshCwIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCommandeDetails,
  useUpdateCommandeStatus,
  useCancelCommande,
  useGenerateInvoice,
  useReplaceCommande,
} from "@/hooks/useCommandes";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLivraison } from "@/hooks/useLivraison";
import { useUtilisateur } from "@/hooks/useUtilisateur";

const statusOptions = [
  { value: "en_attente", label: "En attente", color: "bg-yellow-500" },
  { value: "en_preparation", label: "En préparation", color: "bg-purple-500" },
  { value: "expediee", label: "Expédiée", color: "bg-orange-500" },
  { value: "livree", label: "Livrée", color: "bg-green-500" },
  { value: "annulee", label: "Annulée", color: "bg-red-500" },
  { value: "remplacee", label: "Remplacée", color: "bg-blue-500" },
];

export default function GereCommandePage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [refundChecked, setRefundChecked] = useState(true);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [notesAdmin, setNotesAdmin] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showChangeLivreurDialog, setShowChangeLivreurDialog] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState("");
  const [newLivreurId, setNewLivreurId] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const { 
    livreurs,
    obtenirTousLivreurs,
    loading: loadingLivreurs
  } = useUtilisateur();
  const {
    assignerLivraison,
    loading: loadingLivraison
  } = useLivraison();

  const {
    data: commande,
    isLoading,
    isError,
    refetch,
  } = useCommandeDetails(id);

  const fraisLivraison = commande?.methode_livraison === "express" ? 15 : 7;
  const sousTotal = commande?.prix_total ? (commande.prix_total - fraisLivraison).toFixed(2) : 0;

  useEffect(() => {
    const handleRefresh = () => {
      refetch();
      setLocalLoading(false);
    };

    window.addEventListener('commande-updated', handleRefresh);
    return () => window.removeEventListener('commande-updated', handleRefresh);
  }, [refetch]);

  const dispatchRefresh = () => {
    window.dispatchEvent(new Event('commande-updated'));
  };

  useEffect(() => {
    if (!id) {
      router.push("/admin/ventes/commandes");
      toast.error("ID de commande manquant");
      return;
    }

    if (commande?.notes_admin) {
      setNotesAdmin(commande.notes_admin);
    }

    const fetchLivreurs = async () => {
      try {
        await obtenirTousLivreurs({}, token);
      } catch (error) {
        console.error("Error fetching livreurs:", error);
        toast.error("Erreur lors du chargement des livreurs");
      }
    };

    fetchLivreurs();
  }, [id, commande, isLoading, isError, router, token, obtenirTousLivreurs]);

  const updateStatusMutation = useUpdateCommandeStatus();
  const cancelCommandeMutation = useCancelCommande();
  const generateInvoiceMutation = useGenerateInvoice();
  const replaceCommandeMutation = useReplaceCommande();

  const handleStatusChange = async (newStatus) => {
    setLocalLoading(true);
    try {
      await updateStatusMutation.mutateAsync({ id, statut: newStatus });
      toast.success("Statut de commande mis à jour");
      dispatchRefresh();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAssignLivreur = async () => {
    setLocalLoading(true);
    try {
      await assignerLivraison(commande.id, selectedLivreur, token);
      toast.success("Livreur assigné avec succès");
      setShowAssignDialog(false);
      dispatchRefresh();
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'assignation du livreur");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleChangeLivreur = async () => {
    setLocalLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/livraisons/${commande.id}/modifierLivreurLivraison`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ livreur_id: newLivreurId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change delivery person');
      }

      toast.success("Livreur changé avec succès");
      setShowChangeLivreurDialog(false);
      dispatchRefresh();
    } catch (error) {
      console.error('Error changing delivery person:', error);
      toast.error(error.message || "Erreur lors du changement de livreur");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoiceMutation.mutateAsync(id);
      toast.success("Facture générée avec succès");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la génération de la facture");
    }
  };

  const handleCancelCommande = async () => {
    setLocalLoading(true);
    try {
      await cancelCommandeMutation.mutateAsync({
        id,
        raison: cancelReason,
        rembourser: refundChecked,
      });
      toast.success("Commande annulée avec succès");
      setShowCancelDialog(false);
      dispatchRefresh();
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'annulation de la commande");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleReplaceCommande = async () => {
    setLocalLoading(true);
    try {
      const response = await replaceCommandeMutation.mutateAsync({
        id,
        notes: notesAdmin,
      });
      toast.success("Commande remplacée avec succès");
      setShowReplaceDialog(false);
      dispatchRefresh();
      router.push(`/admin/ventes/commandes/gere/${response.id}`);
    } catch (error) {
      toast.error(error.message || "Erreur lors du remplacement de la commande");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLocalLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/commandes/ajouterNoteAdmin/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes_admin: notesAdmin })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save notes');
      }

      toast.success("Notes enregistrées avec succès");
      dispatchRefresh();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement des notes");
    } finally {
      setLocalLoading(false);
    }
  };

  if (isLoading || loadingLivreurs || updateStatusMutation.isLoading || 
      cancelCommandeMutation.isLoading || loadingLivraison || localLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-4 text-red-500">Erreur lors du chargement de la commande</div>;
  if (!commande) return <div className="p-4">Commande non trouvée</div>;

  const canChangeLivreur = commande.statut === "en_preparation";
  const canCancel = !["annulee", "livree", "remplacee"].includes(commande.statut);
  const canReplace = ["en_preparation", "expediee"].includes(commande.statut);

  return (
    <div className="space-y-6 p-4">
      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l&apos;annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette commande? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Raison de l&apos;annulation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Pourquoi annulez-vous cette commande?"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="refundCheckbox"
                checked={refundChecked}
                onChange={(e) => setRefundChecked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="refundCheckbox">
                Effectuer un remboursement
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelCommande}
              className="bg-red-600 hover:bg-red-700"
              disabled={localLoading}
            >
              {localLoading ? "Traitement..." : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer cette commande</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera une nouvelle commande identique et marquera celle-ci comme remplacée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replaceNotes">Notes (optionnel)</Label>
              <Textarea
                id="replaceNotes"
                value={notesAdmin}
                onChange={(e) => setNotesAdmin(e.target.value)}
                placeholder="Raison du remplacement..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReplaceCommande}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={localLoading}
            >
              {localLoading ? "Traitement..." : "Confirmer le remplacement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Livreur Dialog */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assigner un livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez un livreur pour cette commande
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Select onValueChange={setSelectedLivreur}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un livreur" />
              </SelectTrigger>
              <SelectContent>
                {livreurs.map((livreur) => (
                  <SelectItem 
                    key={livreur.utilisateur_id} 
                    value={livreur.utilisateur_id}
                  >
                    {livreur.utilisateur?.prenom} {livreur.utilisateur?.nom} - {livreur.type_vehicule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignLivreur}
              disabled={!selectedLivreur || localLoading}
            >
              {localLoading ? "Assignation..." : "Assigner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Livreur Dialog */}
      <AlertDialog open={showChangeLivreurDialog} onOpenChange={setShowChangeLivreurDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer de livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez un nouveau livreur pour cette commande
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Select onValueChange={setNewLivreurId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un nouveau livreur" />
              </SelectTrigger>
              <SelectContent>
                {livreurs
                  .filter(l => l.utilisateur_id !== commande.livreur?.utilisateur_id)
                  .map((livreur) => (
                    <SelectItem 
                      key={livreur.utilisateur_id} 
                      value={livreur.utilisateur_id}
                    >
                      {livreur.utilisateur?.prenom} {livreur.utilisateur?.nom} - {livreur.type_vehicule}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeLivreur}
              disabled={!newLivreurId || localLoading || !canChangeLivreur}
            >
              {localLoading ? "Changement en cours..." : "Confirmer le changement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin/ventes/commandes")}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Commande #{commande.reference}
          {commande.remplace_commande_id && (
            <span className="text-sm text-muted-foreground ml-2">
              (Remplace #{commande.remplace_commande_id})
            </span>
          )}
        </h1>
        <Badge className={`ml-auto ${statusOptions.find(s => s.value === commande.statut)?.color} text-white`}>
          {statusOptions.find(s => s.value === commande.statut)?.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client, Delivery, Payment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Nom complet</Label>
                <p>{commande.client?.utilisateur?.prenom} {commande.client?.utilisateur?.nom}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p>{commande.client?.utilisateur?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Téléphone</Label>
                <p>{commande.client?.telephone || "Non renseigné"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Méthode</Label>
                <p className="capitalize">
                  {commande.methode_livraison === "express" ? "Express (15 DT)" : "Standard (7 DT)"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Livreur</Label>
                {commande.livreur ? (
                  <div className="flex items-center gap-2">
                    <p>
                      {commande.livreur.utilisateur?.prenom} {commande.livreur.utilisateur?.nom}
                    </p>
                    <Badge variant="outline">{commande.livreur.type_vehicule}</Badge>
                    {canChangeLivreur && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowChangeLivreurDialog(true)}
                      >
                        Changer
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Aucun livreur assigné</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAssignDialog(true)}
                    >
                      Assigner
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Adresse</Label>
                <p className="space-y-1">
                  <span>{commande.adresse?.adresse}</span><br />
                  {commande.adresse?.complement && (
                    <span>{commande.adresse.complement}<br /></span>
                  )}
                  <span>{commande.adresse?.code_postal} {commande.adresse?.ville}</span><br />
                  <span>{commande.adresse?.gouvernorat}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Méthode</Label>
                <p className="capitalize">{commande.methode_paiement || "Non spécifiée"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div>
                  {commande.statut_paiement === "paye" ? (
                    <Badge className="bg-green-500">Payé</Badge>
                  ) : (
                    <Badge variant="outline">En attente</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Date de commande</Label>
                <p>
                  {new Date(commande.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Statut de la commande</Label>
                <Select
                  value={commande.statut}
                  onValueChange={handleStatusChange}
                  disabled={commande.statut === "annulee" || commande.statut === "remplacee" || localLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                        disabled={
                          commande.statut === "annulee" ||
                          commande.statut === "remplacee" ||
                          (status.value === "en_attente" && commande.statut !== "en_attente") ||
                          localLoading
                        }
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes administratives</Label>
                <Textarea
                  placeholder="Ajouter des notes internes..."
                  className="min-h-[100px]"
                  value={notesAdmin}
                  onChange={(e) => setNotesAdmin(e.target.value)}
                  disabled={localLoading}
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleSaveNotes} 
                    size="sm"
                    disabled={localLoading}
                  >
                    {localLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateInvoice}
                disabled={commande.statut === "annulee" || localLoading}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Télécharger la facture
              </Button>
              <Button variant="outline" disabled={localLoading}>
                <MailIcon className="mr-2 h-4 w-4" />
                Envoyer un email
              </Button>
              {canReplace && (
                <Button
                  variant="outline"
                  onClick={() => setShowReplaceDialog(true)}
                  disabled={localLoading}
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Remplacer la commande
                </Button>
              )}
              <Button
                variant="destructive"
                className="ml-auto"
                onClick={() => setShowCancelDialog(true)}
                disabled={!canCancel || localLoading}
              >
                Annuler la commande
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produits commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[300px]">Produit</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Taille</TableHead>
                      <TableHead className="text-right">Couleur</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commande.articles
                      ?.slice(0, showAllArticles ? commande.articles.length : 4)
                      .map((article) => {
                        const taille = article.tailles?.find(t => t.id === article.CommandeArticle.taille_id);
                        const couleur = article.couleurs?.find(c => c.id === article.CommandeArticle.couleur_id);
                        
                        return (
                          <TableRow key={`${article.id}-${article.CommandeArticle.taille_id}-${article.CommandeArticle.couleur_id}`}>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {article.images?.length > 0 ? (
                                    <img 
                                      src={article.images[0].url} 
                                      alt={article.nom_produit}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/placeholder-product.jpg";
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs text-gray-500">Image</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{article.nom_produit}</p>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p className="truncate">Réf: {article.sku}</p>
                                    <p>Marque: {article.marque?.libelle}</p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {article.CommandeArticle.prix_unitaire.toFixed(2)} DT
                            </TableCell>
                            <TableCell className="text-right">
                              {article.CommandeArticle.quantite}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {taille?.libelle || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {couleur && (
                                <div className="flex items-center justify-end gap-2">
                                  <span 
                                    className="h-4 w-4 rounded-full border" 
                                    style={{ backgroundColor: couleur.hexcode }}
                                  />
                                  <span>{couleur.libelle}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {(article.CommandeArticle.prix_unitaire * article.CommandeArticle.quantite).toFixed(2)} DT
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
              {commande.articles?.length > 4 && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllArticles(!showAllArticles)}
                    className="flex items-center gap-2"
                  >
                    {showAllArticles ? (
                      <>
                        <ChevronUpIcon className="h-4 w-4" />
                        Voir moins
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="h-4 w-4" />
                        Voir tous les articles ({commande.articles.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{sousTotal} DT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{fraisLivraison.toFixed(2)} DT</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{commande.prix_total.toFixed(2)} DT</span>
              </div>
            </CardContent>
          </Card>

          {commande.historique?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commande.historique.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString("fr-FR")}
                        </p>
                        {event.details && (
                          <p className="text-sm mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}