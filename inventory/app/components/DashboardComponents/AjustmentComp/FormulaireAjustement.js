"use client"
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const RAISONS = [
  "Réception fournisseur",
  "Retour client",
  "Inventaire physique",
  "Correction de stock",
  "Défectuosité",
  "Transfert",
  "Autre"
];

const TYPES_AJUSTEMENT = [
  { value: 'adjustment', label: 'Ajustement standard (+/-)' },
  { value: 'correction', label: 'Correction (valeur absolue)' }
];

export default function FormulaireAjustement({
  adjustment,
  index = 0,
  produits = [],
  tailles = [],
  couleurs = [],
  onAdjustmentChange,
  onRemove,
  showRemoveButton = false,
  loading = false
}) {
  const [localAdjustment, setLocalAdjustment] = useState(adjustment);
  const [filteredTailles, setFilteredTailles] = useState([]);

  useEffect(() => {
    setLocalAdjustment(adjustment);
  }, [adjustment]);

  useEffect(() => {
    if (localAdjustment.idCouleur && couleurs.length > 0) {
      const selectedColor = couleurs.find(c => c.id.toString() === localAdjustment.idCouleur.toString());
      if (selectedColor && selectedColor.sizes) {
        setFilteredTailles(selectedColor.sizes);
        
        // Update current stock if a size is already selected
        if (localAdjustment.idTaille) {
          const selectedSize = selectedColor.sizes.find(s => s.id.toString() === localAdjustment.idTaille.toString());
          if (selectedSize) {
            const updatedAdjustment = {
              ...localAdjustment,
              stockActuel: selectedSize.quantite
            };
            setLocalAdjustment(updatedAdjustment);
            onAdjustmentChange(index, updatedAdjustment);
          }
        }
      } else {
        setFilteredTailles([]);
      }
    } else {
      setFilteredTailles([]);
    }
  }, [localAdjustment.idCouleur, couleurs, localAdjustment.idTaille]);

  const handleChange = (field, value) => {
    const updatedAdjustment = { ...localAdjustment, [field]: value };
    
    if (field === 'idProduit') {
      updatedAdjustment.idTaille = "";
      updatedAdjustment.idCouleur = "";
      updatedAdjustment.stockActuel = 0;
    } else if (field === 'raison' && value !== 'Autre') {
      updatedAdjustment.raison_autre = "";
    } else if (field === 'idCouleur') {
      updatedAdjustment.idTaille = "";
      updatedAdjustment.stockActuel = 0;
    } else if (field === 'idTaille' && localAdjustment.idCouleur) {
      const selectedColor = couleurs.find(c => c.id.toString() === localAdjustment.idCouleur.toString());
      if (selectedColor && selectedColor.sizes) {
        const selectedSize = selectedColor.sizes.find(s => s.id.toString() === value.toString());
        if (selectedSize) {
          updatedAdjustment.stockActuel = selectedSize.quantite;
        }
      }
    }

    setLocalAdjustment(updatedAdjustment);
    onAdjustmentChange(index, updatedAdjustment);
  };

  return (
    <div className="grid gap-4 border p-4 rounded-lg relative group">
      {showRemoveButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(index)}
          disabled={loading}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}

      <div className="grid gap-2">
        <Label>Type d&apos;ajustement *</Label>
        <RadioGroup
          value={localAdjustment.type}
          onValueChange={(value) => handleChange('type', value)}
          className="flex gap-4"
        >
          {TYPES_AJUSTEMENT.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={type.value} 
                id={`${type.value}-${index}`} 
                disabled={loading}
              />
              <Label htmlFor={`${type.value}-${index}`}>{type.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Produit *</Label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={localAdjustment.idProduit}
            onChange={(e) => handleChange('idProduit', e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Sélectionner un produit</option>
            {produits.map(produit => (
              <option key={produit.id} value={produit.id}>
                {produit.nom_produit} {produit.sku && `(SKU: ${produit.sku})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Couleur *</Label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={localAdjustment.idCouleur}
            onChange={(e) => handleChange('idCouleur', e.target.value)}
            disabled={!localAdjustment.idProduit || loading}
            required
          >
            <option value="">Sélectionner une couleur</option>
            {couleurs.map(couleur => (
              <option key={couleur.id} value={couleur.id}>
                {couleur.libelle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Taille *</Label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={localAdjustment.idTaille}
            onChange={(e) => handleChange('idTaille', e.target.value)}
            disabled={!localAdjustment.idCouleur || loading}
            required
          >
            <option value="">Sélectionner une taille</option>
            {filteredTailles.map(taille => (
              <option key={taille.id} value={taille.id}>
                {taille.libelle} (Stock: {taille.quantite || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            {localAdjustment.type === 'correction'
              ? "Nouvelle quantité *"
              : "Quantité à ajuster * (+/-)"}
          </Label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={localAdjustment.quantite}
            onChange={(e) => handleChange('quantite', e.target.value)}
            required
            min={localAdjustment.type === 'correction' ? "0" : undefined}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {localAdjustment.type === 'correction'
              ? "Entrez la nouvelle valeur absolue du stock"
              : "Positif pour ajouter, négatif pour retirer"}
          </p>
          {localAdjustment.idTaille && localAdjustment.idCouleur && (
            <p className="text-sm mt-1">
              Stock actuel: {localAdjustment.stockActuel} → Nouveau stock:{" "}
              {localAdjustment.type === 'correction'
                ? localAdjustment.quantite
                : (localAdjustment.stockActuel || 0) + (parseInt(localAdjustment.quantite) || 0)
              }
            </p>
          )}
        </div>

        <div>
          <Label>Raison *</Label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={localAdjustment.raison}
            onChange={(e) => handleChange('raison', e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Sélectionner une raison</option>
            {RAISONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {localAdjustment.raison === 'Autre' && (
            <div className="mt-2">
              <Label>Précisez la raison *</Label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={localAdjustment.raison_autre}
                onChange={(e) => handleChange('raison_autre', e.target.value)}
                required
                placeholder="Entrez la raison de l'ajustement"
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}