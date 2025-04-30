'use client'
import React, { useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCommandesStore } from '@/hooks/useCommandesStore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const CommandeDetailsModal = ({ commandeId, open, onOpenChange }) => {
  const { commande, loading, fetchCommandeDetails } = useCommandesStore();

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchDetails = useCallback(async () => {
    if (open && commandeId && (!commande || commande.id !== commandeId)) {
      await fetchCommandeDetails(commandeId);
    }
  }, [open, commandeId, commande, fetchCommandeDetails]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la commande</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : commande ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Référence</h3>
                <p>{commande.reference}</p>
              </div>
              <div>
                <h3 className="font-medium">Statut</h3>
                <Badge 
                  className={`${
                    commande.statut === 'annulee' ? 'bg-red-500' :
                    commande.statut === 'livree' ? 'bg-green-500' :
                    'bg-yellow-500'
                  } text-white`}
                >
                  {commande.statut}
                </Badge>
              </div>
              <div>
                <h3 className="font-medium">Date</h3>
                <p>{format(new Date(commande.created_at), 'PPPp', { locale: fr })}</p>
              </div>
              <div>
                <h3 className="font-medium">Total</h3>
                <p>{commande.prix_total} DT</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-2">Client</h3>
              <p>{commande.client?.utilisateur?.prenom} {commande.client?.utilisateur?.nom}</p>
              <p>{commande.client?.utilisateur?.email}</p>
              <p>{commande.client?.telephone}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-2">Adresse de livraison</h3>
              <p>{commande.adresse?.adresse}</p>
              <p>{commande.adresse?.complement}</p>
              <p>{commande.adresse?.code_postal} {commande.adresse?.ville}</p>
              <p>{commande.adresse?.gouvernorat}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-2">Articles</h3>
              <div className="space-y-4">
                {commande.articles?.map((article) => (
                  <div key={article.id} className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{article.nom_produit}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {article.CommandeArticle.quantite}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prix unitaire: {article.CommandeArticle.prix_unitaire} DT
                      </p>
                    </div>
                    <p className="font-medium">
                      {article.CommandeArticle.prix_unitaire * article.CommandeArticle.quantite} DT
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{commande.prix_total} DT</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison:</span>
                <span>{commande.frais_livraison} DT</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total:</span>
                <span>{commande.prix_total + commande.frais_livraison} DT</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Impossible de charger les détails de la commande</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};