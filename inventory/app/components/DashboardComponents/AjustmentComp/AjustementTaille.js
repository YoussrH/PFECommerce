"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormulaireAjustement from "./FormulaireAjustement";

export default function AjustementTaille() {
  const { user, isAdmin } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [produits, setProduits] = useState([]);
  const [tailles, setTailles] = useState([]);
  const [adjustment, setAdjustment] = useState({
    idProduit: "",
    idTaille: "",
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

  const chargerTailles = async (idProduit) => {
    if (!idProduit) {
      setTailles([]);
      return;
    }

    try {
      setChargement(true);
      const response = await axios.get(
        `http://localhost:5000/articles/obtenirArticleParId/${idProduit}`,
        { withCredentials: true }
      );
      setTailles(response.data.donnees?.tailles || []);
    } catch (error) {
      toast.error("Échec du chargement des tailles");
    } finally {
      setChargement(false);
    }
  };

  const handleAdjustmentChange = (index, updatedAdjustment) => {
    setAdjustment(updatedAdjustment);
    if (updatedAdjustment.idProduit !== adjustment.idProduit) {
      chargerTailles(updatedAdjustment.idProduit);
    }
  };

  const validerFormulaire = () => {
    if (!adjustment.idProduit) {
      toast.warning("Sélection du produit requise");
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
        quantite: 0,
        raison: "",
        raison_autre: "",
        type: 'adjustment',
        stockActuel: 0
      });
      setTailles([]);
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