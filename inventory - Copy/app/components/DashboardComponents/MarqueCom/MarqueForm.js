import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { useAuth } from "@/app/contexts/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
export default function MarqueForm({ onSuccess }) {
  const [libelle, setLibelle] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libelle.trim()) {
      toast.error("Le nom de la marque ne peut pas être vide.");
      return;
    }
  
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/marques/ajouterMarque", 
        { libelle },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setLibelle("");
      toast.success("Marque ajoutée avec succès !");
      onSuccess();
    } catch (error) {
      console.error("Error adding marque:", error);
      toast.error(error.response?.data?.message || "Échec de l'ajout de la marque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="libelle" className="text-right">
          Nom
        </Label>
        <Input
          id="libelle"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className="col-span-3"
          placeholder="Entrez le nom de la marque"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          type="button" 
          onClick={() => onSuccess()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}