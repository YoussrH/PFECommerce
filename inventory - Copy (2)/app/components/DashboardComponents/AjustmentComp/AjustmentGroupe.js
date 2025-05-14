"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import FormulaireAjustement from "./FormulaireAjustement";

export default function AjustmentGroupe() {
  const { user, isAdmin } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [produits, setProduits] = useState([]);
  const [taillesMap, setTaillesMap] = useState({});
  const [couleursMap, setCouleursMap] = useState({});
  const [ajustements, setAjustements] = useState([{
    idProduit: "",
    idTaille: "",
    idCouleur: "",
    quantite: 0,
    raison: "",
    raison_autre: "",
    type: 'adjustment',
    stockActuel: 0
  }]);

  const chargerProduits = async () => {
    try {
      const res = await axios.get('http://localhost:5000/articles', {
        withCredentials: true
      });
      setProduits(res.data.donnees || []);
    } catch (error) {
      toast.error('Erreur de chargement des produits', {
        description: error.response?.data?.message || "Veuillez réessayer"
      });
    }
  };

  const chargerTaillesEtCouleurs = async (idProduit) => {
    if (!idProduit || (taillesMap[idProduit] && couleursMap[idProduit])) return;
    
    try {
      const res = await axios.get(
        `http://localhost:5000/articles/obtenirArticleParId/${idProduit}`,
        { withCredentials: true }
      );
      
      const article = res.data.donnees;
      
      // Process tailles with inventory data
      const inventoryRecords = article?.inventory || [];
      const uniqueTailles = [];
      const seenTailles = new Set();
      
      inventoryRecords.forEach(record => {
        if (record.taille && !seenTailles.has(record.taille.id)) {
          seenTailles.add(record.taille.id);
          uniqueTailles.push({
            ...record.taille,
            ArticleTaille: record
          });
        }
      });
      
      setTaillesMap(prev => ({ ...prev, [idProduit]: uniqueTailles }));
      
      // Process couleurs from inventory and images
      const uniqueCouleurs = [];
      const seenCouleurs = new Set();
      
      // Add colors from inventory
      inventoryRecords.forEach(record => {
        if (record.couleur && !seenCouleurs.has(record.couleur.id)) {
          seenCouleurs.add(record.couleur.id);
          uniqueCouleurs.push(record.couleur);
        }
      });
      
      // Add colors from images
      const imageCouleurs = article?.images_couleurs || [];
      imageCouleurs.forEach(image => {
        if (image.couleur && !seenCouleurs.has(image.couleur.id)) {
          seenCouleurs.add(image.couleur.id);
          uniqueCouleurs.push(image.couleur);
        }
      });
      
      setCouleursMap(prev => ({ ...prev, [idProduit]: uniqueCouleurs }));
    } catch (error) {
      toast.error('Erreur de chargement des tailles et couleurs', {
        description: error.response?.data?.message || "Veuillez réessayer"
      });
    }
  };

  const ajouterAjustement = () => {
    setAjustements([...ajustements, { 
      idProduit: "", 
      idTaille: "", 
      idCouleur: "",
      quantite: 0, 
      raison: "", 
      raison_autre: "",
      type: 'adjustment',
      stockActuel: 0
    }]);
  };

  const supprimerAjustement = (index) => {
    if (ajustements.length <= 1) {
      toast.warning("Au moins un ajustement est requis");
      return;
    }
    const newAjustements = [...ajustements];
    newAjustements.splice(index, 1);
    setAjustements(newAjustements);
  };

  const handleAdjustmentChange = (index, updatedAdjustment) => {
    const newAjustements = [...ajustements];
    newAjustements[index] = updatedAdjustment;
    setAjustements(newAjustements);

    if (updatedAdjustment.idProduit !== ajustements[index]?.idProduit) {
      chargerTaillesEtCouleurs(updatedAdjustment.idProduit);
    }
  };

  const validerAjustements = () => {
    for (const adj of ajustements) {
      if (!adj.idProduit) {
        toast.warning("Produit manquant", {
          description: "Veuillez sélectionner un produit pour tous les ajustements"
        });
        return false;
      }
      
      if (!adj.idCouleur) {
        toast.warning("Couleur manquante", {
          description: "Veuillez sélectionner une couleur pour tous les ajustements"
        });
        return false;
      }
      
      if (!adj.idTaille) {
        toast.warning("Taille manquante", {
          description: "Veuillez sélectionner une taille pour tous les ajustements"
        });
        return false;
      }
      
      if (adj.quantite === 0) {
        toast.warning("Quantité invalide", {
          description: "La quantité ne peut pas être zéro"
        });
        return false;
      }
      
      if (!adj.raison) {
        toast.warning("Raison manquante", {
          description: "Veuillez sélectionner une raison pour tous les ajustements"
        });
        return false;
      }
      
      if (adj.raison === 'Autre' && (!adj.raison_autre || adj.raison_autre.trim() === '')) {
        toast.warning("Raison manquante", {
          description: "Veuillez préciser la raison pour les ajustements marqués 'Autre'"
        });
        return false;
      }
      
      if (adj.type === 'adjustment') {
        const newQuantity = adj.stockActuel + parseInt(adj.quantite);
        if (newQuantity < 0) {
          toast.warning("Stock négatif", {
            description: `La quantité ne peut pas être négative (Stock actuel: ${adj.stockActuel})`
          });
          return false;
        }
      }
    }
    
    return true;
  };

  const soumettreAjustements = async (e) => {
    e.preventDefault();
    if (!validerAjustements()) return;
    
    setChargement(true);
    const toastId = toast.loading("Enregistrement des ajustements...");

    try {
      const response = await axios.post(
        'http://localhost:5000/ajustements/multiple',
        {
          adjustments: ajustements.map(adj => ({
            article_id: adj.idProduit,
            taille_id: adj.idTaille,
            couleur_id: adj.idCouleur,
            quantite: adj.quantite,
            raison: adj.raison,
            raison_autre: adj.raison === 'Autre' ? adj.raison_autre : null,
            type: adj.type
          }))
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const successCount = response.data.results.filter(r => r.success).length;
        toast.success(`Ajustements enregistrés avec succès`, {
          description: `${successCount}/${ajustements.length} ajustement(s) effectué(s)`,
          id: toastId
        });
        
        setAjustements([{
          idProduit: "", 
          idTaille: "", 
          idCouleur: "",
          quantite: 0, 
          raison: "", 
          raison_autre: "",
          type: 'adjustment',
          stockActuel: 0
        }]);
      } else {
        toast.error("Erreur lors des ajustements", {
          description: response.data.message || "Une erreur est survenue",
          id: toastId
        });
      }
    } catch (error) {
      console.error('Erreur API:', error);
      toast.error("Échec des ajustements", {
        description: error.response?.data?.message || "Une erreur est survenue",
        id: toastId
      });
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      chargerProduits();
    }
  }, [isAdmin]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ajustements groupés</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={soumettreAjustements} className="space-y-4">
            {ajustements.map((adjustment, index) => (
              <FormulaireAjustement
                key={index}
                index={index}
                adjustment={adjustment}
                produits={produits}
                tailles={taillesMap[adjustment.idProduit] || []}
                couleurs={couleursMap[adjustment.idProduit] || []}
                onAdjustmentChange={handleAdjustmentChange}
                onRemove={supprimerAjustement}
                showRemoveButton={ajustements.length > 1}
                loading={chargement}
              />
            ))}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={ajouterAjustement}
                disabled={chargement}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un ajustement
              </Button>

              <Button type="submit" disabled={chargement}>
                {chargement ? "En cours..." : "Enregistrer les ajustements"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}