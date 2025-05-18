"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormulaireAjustement from "./FormulaireAjustement";

export default function AjustementTaille() {
  const { user, isAdmin } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [produits, setProduits] = useState([]);
  const [tailles, setTailles] = useState([]);
  const [couleurs, setCouleurs] = useState([]);
  const [adjustment, setAdjustment] = useState({
    idProduit: "",
    idTaille: "",
    idCouleur: "",
    quantite: 0,
    raison: "",
    raison_autre: "",
    type: 'adjustment',
    stockActuel: 0
  });

  const chargerProduits = async () => {
    try {
      const response = await axios.get('http://localhost:5000/articles', {
        withCredentials: true
      });
      setProduits(response.data.donnees || []);
    } catch (error) {
      toast.error("Échec du chargement des produits");
    }
  };

  const chargerTaillesEtCouleurs = async (idProduit) => {
    if (!idProduit) {
      setTailles([]);
      setCouleurs([]);
      return;
    }

    try {
      setChargement(true);
      const response = await axios.get(
        `http://localhost:5000/articles/obtenirArticleParId/${idProduit}`,
        { withCredentials: true }
      );
      
      const articleData = response.data.donnees;
      
      // Extract colors with their sizes and quantities
      const colorsWithSizes = [];
      const sizesMap = new Map(); // To track all unique sizes
      
      // Process tailles_par_couleur from the response
      if (articleData.tailles_par_couleur) {
        Object.entries(articleData.tailles_par_couleur).forEach(([colorId, colorData]) => {
          const colorInfo = colorData.couleur;
          const sizesForColor = colorData.tailles.map(size => ({
            id: size.id,
            libelle: size.libelle,
            quantite: size.quantite,
            couleur_id: colorId
          }));
          
          // Add to colors list
          colorsWithSizes.push({
            ...colorInfo,
            sizes: sizesForColor
          });
          
          // Add sizes to global sizes map
          sizesForColor.forEach(size => {
            if (!sizesMap.has(size.id)) {
              sizesMap.set(size.id, {
                id: size.id,
                libelle: size.libelle,
                ArticleTaille: {
                  couleur_id: colorId,
                  quantite: size.quantite
                }
              });
            }
          });
        });
      }
      
      // Set colors with their sizes
      setCouleurs(colorsWithSizes);
      
      // Convert sizes map to array for the tailles state
      setTailles(Array.from(sizesMap.values()));
      
    } catch (error) {
      toast.error("Échec du chargement des tailles et couleurs");
      console.error("Error loading sizes and colors:", error);
    } finally {
      setChargement(false);
    }
  };

  const handleAdjustmentChange = (index, updatedAdjustment) => {
    setAdjustment(updatedAdjustment);
    if (updatedAdjustment.idProduit !== adjustment.idProduit) {
      chargerTaillesEtCouleurs(updatedAdjustment.idProduit);
    }
  };

  const validerFormulaire = () => {
    if (!adjustment.idProduit) {
      toast.warning("Sélection du produit requise");
      return false;
    }

    if (!adjustment.idCouleur) {
      toast.warning("Sélection de la couleur requise");
      return false;
    }

    if (!adjustment.idTaille) {
      toast.warning("Sélection de la taille requise");
      return false;
    }

    if (adjustment.quantite === 0) {
      toast.warning("Quantité invalide");
      return false;
    }

    if (adjustment.type === 'correction' && adjustment.quantite < 0) {
      toast.warning("Quantité invalide");
      return false;
    }

    if (!adjustment.raison) {
      toast.warning("Raison requise");
      return false;
    }

    if (adjustment.raison === 'Autre' && (!adjustment.raison_autre || adjustment.raison_autre.trim() === '')) {
      toast.warning("Veuillez préciser la raison");
      return false;
    }

    return true;
  };

  const soumettreAjustement = async (e) => {
    e.preventDefault();
    if (!validerFormulaire()) return;

    setChargement(true);
    const toastId = toast.loading("Enregistrement de l'ajustement...");

    try {
      await axios.post(
        'http://localhost:5000/ajustements/ajuster',
        {
          article_id: adjustment.idProduit,
          taille_id: adjustment.idTaille,
          couleur_id: adjustment.idCouleur,
          quantite: Number(adjustment.quantite),
          raison: adjustment.raison,
          raison_autre: adjustment.raison === 'Autre' ? adjustment.raison_autre : null,
          type: adjustment.type
        },
        { withCredentials: true }
      );

      toast.success("Ajustement réussi");
      toast.dismiss(toastId);

      // Reset form
      setAdjustment({
        idProduit: "",
        idTaille: "",
        idCouleur: "",
        quantite: 0,
        raison: "",
        raison_autre: "",
        type: 'adjustment',
        stockActuel: 0
      });
      setTailles([]);
      setCouleurs([]);
    } catch (error) {
      console.error('Erreur API:', error);
      toast.error("Échec de l'ajustement");
      toast.dismiss(toastId);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (isAdmin) chargerProduits();
  }, [isAdmin]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ajustement de stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={soumettreAjustement} className="space-y-4">
            <FormulaireAjustement
              adjustment={adjustment}
              produits={produits}
              tailles={tailles}
              couleurs={couleurs}
              onAdjustmentChange={handleAdjustmentChange}
              loading={chargement}
            />

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={chargement}>
                {chargement ? "En cours..." : "Enregistrer l'ajustement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}