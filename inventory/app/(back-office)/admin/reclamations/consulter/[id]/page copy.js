"use client";

import { useEffect, useState } from 'react';
import { notFound, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { use } from 'react';
export default function ViewReclamation({ params }) {
  // Properly unwrap the params Promise using use()
  const { id } = use(params);
  
  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!id) return;

    const fetchReclamation = async () => {
      try {
        setLoading(true);
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/reclamations/consulter/${id}`, {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            return notFound();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setReclamation(data.data);
          setResponse(data.data.reponse || '');
        } else {
          toast.error('Failed to fetch reclamation details');
          notFound();
        }
      } catch (error) {
        console.error('Error fetching reclamation:', error);
        toast.error('Failed to load reclamation');
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchReclamation();
  }, [id, token]);
 const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error('Veuillez écrire une réponse');
      return;
    }

    setSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://localhost:5000/reclamations/repondre/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ reponse: response }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Réponse envoyée avec succès');
        router.push('/admin/reclamations/traitees');
      } else {
        toast.error(data.message || 'Erreur lors de l\'envoi de la réponse');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const parseFichiers = (fichiers) => {
    try {
      if (Array.isArray(fichiers)) return fichiers;
      if (typeof fichiers === 'string') return JSON.parse(fichiers);
      return [];
    } catch (e) {
      console.error('Error parsing fichiers:', e);
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      return format(new Date(dateString), 'PPpp', { locale: fr });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reclamation) {
    return notFound();
  }

  const fichiers = parseFichiers(reclamation.fichiers);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Réclamation {reclamation.reference}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={reclamation.statut === "nouveau" ? "destructive" : "secondary"}>
                {reclamation.statut}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Client</h3>
              <p>{reclamation.prefix} {reclamation.prenom} {reclamation.nom}</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p>{reclamation.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Téléphone</h3>
              <p>{reclamation.telephone || 'Non spécifié'}</p>
            </div>
            <div>
              <h3 className="font-medium">Commande</h3>
              <p>{reclamation.numero_commande || 'Non spécifiée'}</p>
            </div>
            <div>
              <h3 className="font-medium">Date de création</h3>
              <p>{formatDate(reclamation.date_creation)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Sujet</h3>
            <p>{reclamation.sujet}</p>
          </div>
          
          <div>
            <h3 className="font-medium">Message</h3>
            <p className="whitespace-pre-line">{reclamation.message}</p>
          </div>
          
          {fichiers.length > 0 && (
            <div>
              <h3 className="font-medium">Pièces jointes</h3>
              <div className="flex flex-wrap gap-2">
                {fichiers.map((file, index) => (
                  <a 
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {file.name} ({file.size})
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mb-2">Réponse</h3>
            <Textarea 
              placeholder="Écrivez votre réponse ici..." 
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Enregistrer comme brouillon</Button>
          <Button onClick={handleSubmitResponse} disabled={submitting}>
            {submitting ? 'Envoi en cours...' : 'Envoyer la réponse'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
