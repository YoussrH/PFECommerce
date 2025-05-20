"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useReclamations } from "@/hooks/useReclamations";
export default function ConsulterReclamation() {
  const { id } = useParams();
  const [response, setResponse] = useState("");
  const {
    selectedReclamation,
    loading,
    fetchReclamationById,
    respondToReclamation
  } = useReclamations();

  useEffect(() => {
    const loadReclamation = async () => {
      try {
        await fetchReclamationById(id);
        if (selectedReclamation?.reponse) {
          setResponse(selectedReclamation.reponse);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    loadReclamation();
  }, [id, fetchReclamationById]);

  const handleSubmit = async () => {
    try {
      await respondToReclamation(id, response);
      toast.success("Réponse envoyée avec succès");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!selectedReclamation) return <div>Réclamation non trouvée</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Réclamation {selectedReclamation.id.slice(0, 8).toUpperCase()}</span>
            <Badge variant={selectedReclamation.statut === "traite" ? "success" : "warning"}>
              {selectedReclamation.statut}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Client</h3>
              <p>
                {selectedReclamation.prefix} {selectedReclamation.prenom} {selectedReclamation.nom}
              </p>
              <p>{selectedReclamation.email}</p>
              {selectedReclamation.telephone && <p>{selectedReclamation.telephone}</p>}
            </div>

            <div>
              <h3 className="font-medium">Sujet</h3>
              <p>{selectedReclamation.sujet}</p>
            </div>

            <div>
              <h3 className="font-medium">Message</h3>
              <p className="whitespace-pre-line">{selectedReclamation.message}</p>
            </div>

            {selectedReclamation.fichiers && selectedReclamation.fichiers.length > 0 && (
              <div>
                <h3 className="font-medium">Fichiers joints</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedReclamation.fichiers.map((file, index) => (
                    <a 
                      key={index} 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {file.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répondre</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Écrivez votre réponse ici..."
            className="min-h-[200px]"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer la réponse"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}