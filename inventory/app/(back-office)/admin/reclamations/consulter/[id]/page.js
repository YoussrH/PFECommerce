"use client"

import { use, useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/contexts/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeftIcon,
  PaperclipIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShoppingCartIcon,
  CalendarIcon,
  MessageSquareIcon,
  SendIcon,
  SaveIcon,
  DownloadIcon,
  ImageIcon,
  FileIcon,
  X
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ViewReclamation({ params }) {
  const { id } = use(params);
  const [reclamation, setReclamation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const router = useRouter()
  const { token,user } = useAuth()

  // Parse fichiers array from string or object
  const parseFichiers = (fichiers) => {
    try {
      if (!fichiers) return [];
      if (Array.isArray(fichiers)) return fichiers;

      if (typeof fichiers === 'string') {
        try {
          // Try direct parse
          const parsed = JSON.parse(fichiers);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // Try cleaning string if parse fails
          const cleaned = fichiers
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/^"|"$/g, '');
          const parsed = JSON.parse(cleaned);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
      }
      return [];
    } catch (e) {
      console.error('Error parsing fichiers:', e);
      return [];
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

const handleDownload = async (fileUrl, fileName, fileType) => {
  try {
    // For Cloudinary files
    if (fileUrl.includes('res.cloudinary.com')) {
      let downloadUrl = fileUrl;
      
      // Check if this is an authenticated resource
      const isAuthenticated = fileUrl.includes('/authenticated/');
      
      // For authenticated files, get signed URL from backend
      if (isAuthenticated) {
        const response = await fetch('http://localhost:5000/reclamations/signed-url', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          body: JSON.stringify({ fileUrl })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get secure download URL');
        }

        const { signedUrl } = await response.json();
        downloadUrl = signedUrl;
      }

      // Add force download parameter
      downloadUrl = downloadUrl.includes('?') 
        ? `${downloadUrl}&fl_attachment=${encodeURIComponent(fileName || 'file')}` 
        : `${downloadUrl}?fl_attachment=${encodeURIComponent(fileName || 'file')}`;

      // Create temporary link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
      return;
    }

    // For non-Cloudinary files
    const response = await fetch(fileUrl, {
       headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);

  } catch (error) {
    console.error('Download failed:', {
      error: error.message,
      stack: error.stack,
      fileUrl,
      fileName,
      fileType
    });
    toast.error(`Échec du téléchargement: ${error.message || 'Erreur inconnue'}`);
  }
};
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux (max 5MB): ${file.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newAttachments = validFiles.map((file) => ({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    if (newAttachments[index].preview) {
      URL.revokeObjectURL(newAttachments[index].preview);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Submit response
  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error("Veuillez écrire une réponse");
      return;
    }

    setSubmitting(true);
    try {
      let fileUrls = [];

      if (attachments.length > 0) {
        setUploadingFiles(true);
        const formData = new FormData();
        
        attachments.forEach((attachment) => {
          formData.append("files", attachment.file, attachment.name);
        });

        const uploadResponse = await fetch("http://localhost:5000/reclamations/fichiers/upload", {
          method: "POST",
           headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          credentials: "include",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(errorText || "Erreur lors du téléchargement des fichiers");
        }

        const uploadData = await uploadResponse.json();
        fileUrls = uploadData.files || [];
      }

      const res = await fetch(`http://localhost:5000/reclamations/repondre/${id}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        credentials: "include",
        body: JSON.stringify({
          reponse: response,
          fichiers: fileUrls
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Réponse envoyée avec succès");
        router.push("/admin/reclamations/inbox");
      } else {
        toast.error(data.message || "Erreur lors de l'envoi de la réponse");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error(error.message || "Erreur lors de l'envoi de la réponse");
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch(`http://localhost:5000/reclamations/sauvegarder-brouillon/${id}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
        credentials: "include",
        body: JSON.stringify({ reponse: response }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Brouillon sauvegardé");
      } else {
        toast.error(data.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Erreur lors de la sauvegarde du brouillon");
    } finally {
      setSavingDraft(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    try {
      return format(new Date(dateString), "PPpp", { locale: fr });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "nouveau":
        return <Badge variant="destructive">Nouveau</Badge>;
      case "traite":
        return <Badge className="bg-green-100 text-green-700">Traité</Badge>;
      case "archive":
        return <Badge variant="secondary">Archivé</Badge>;
      case "brouillon":
        return <Badge className="bg-amber-50 text-amber-700">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch reclamation data
  useEffect(() => {
    if (!id) return;

    const fetchReclamation = async () => {
      try {
        setLoading(true);
        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/reclamations/consulter/${id}`, {
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            return notFound();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          const parsedFichiers = parseFichiers(data.data.fichiers);
          setReclamation({
            ...data.data,
            fichiers: parsedFichiers
          });
          setResponse(data.data.reponse || "");
        } else {
          toast.error("Impossible de récupérer les détails de la réclamation");
          notFound();
        }
      } catch (error) {
        console.error("Error fetching reclamation:", error);
        toast.error("Erreur lors du chargement de la réclamation");
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchReclamation();
  }, [id, token]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, [attachments]);

  if (loading) {
    return <ReclamationDetailSkeleton />;
  }

  if (!reclamation) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Réclamation {reclamation.reference}</CardTitle>
              <p className="text-muted-foreground text-sm">{reclamation.sujet}</p>
            </div>
            <div>{getStatusBadge(reclamation.statut)}</div>
          </div>
        </CardHeader>

        <CardContent className="p-6 grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-secondary/50 p-2 rounded-full">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                  <p className="font-medium">
                    {reclamation.prefix} {reclamation.prenom} {reclamation.nom}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-secondary/50 p-2 rounded-full">
                  <MailIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="font-medium">{reclamation.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-secondary/50 p-2 rounded-full">
                  <PhoneIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Téléphone</h3>
                  <p className="font-medium">{reclamation.telephone || "Non spécifié"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-secondary/50 p-2 rounded-full">
                  <ShoppingCartIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Commande</h3>
                  <p className="font-medium">{reclamation.numero_commande || "Non spécifiée"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-secondary/50 p-2 rounded-full">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date de création</h3>
                  <p className="font-medium">{formatDate(reclamation.date_creation)}</p>
                </div>
              </div>

              {reclamation.date_reponse && (
                <div className="flex items-start gap-3">
                  <div className="bg-secondary/50 p-2 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date de réponse</h3>
                    <p className="font-medium">{formatDate(reclamation.date_reponse)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Message du client</h3>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg whitespace-pre-line">
              {reclamation.message}
            </div>
          </div>

          {reclamation.fichiers?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PaperclipIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Pièces jointes ({reclamation.fichiers.length})</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {reclamation.fichiers.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary/30 hover:bg-secondary/50 transition-colors p-2 px-3 rounded-lg text-sm cursor-pointer"
                    onClick={() => handleDownload(file.url, file.name, file.type)}
                  >
                    {file.type?.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    <DownloadIcon className="h-4 w-4 ml-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reclamation.statut !== "archive" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Votre réponse</h3>
              </div>
              <Textarea
                placeholder="Écrivez votre réponse ici..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="min-h-[200px]"
              />

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="h-5 w-5 text-primary" />
                  <Label htmlFor="file-upload" className="font-medium cursor-pointer">
                    Joindre des fichiers
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    Parcourir
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
                    <h4 className="text-sm font-medium">Fichiers à joindre ({attachments.length})</h4>
                    <div className="grid gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white p-2 rounded border border-secondary"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              <FileIcon className="h-4 w-4" />
                            )}
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {reclamation.statut !== "archive" && (
          <CardFooter className="p-6 pt-0 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting || uploadingFiles}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {savingDraft ? "Sauvegarde..." : "Enregistrer comme brouillon"}
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={submitting || uploadingFiles}
            >
              <SendIcon className="h-4 w-4 mr-2" />
              {uploadingFiles
                ? "Téléchargement des fichiers..."
                : submitting
                  ? "Envoi en cours..."
                  : "Envoyer la réponse"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function ReclamationDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-24" />
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>

        <CardContent className="p-6 grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex justify-end gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </CardFooter>
      </Card>
    </div>
  );
}