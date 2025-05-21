"use client"

import { useEffect, useState } from "react"
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
  FileIcon
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

import { use } from "react"

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
  const { token } = useAuth()

const parseFichiers = (fichiers) => {
  try {
    if (!fichiers) return [];
    if (Array.isArray(fichiers)) return fichiers;

    if (typeof fichiers === 'string') {
      try {
        const parsed = JSON.parse(fichiers);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        try {
          const unescaped = fichiers.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          const parsed = JSON.parse(unescaped);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e2) {
          if (fichiers.includes('uploads\\')) {
            console.warn('Invalid file path detected:', fichiers);
            return [];
          }
          console.error('Error parsing fichiers:', e2);
          return [];
        }
      }
    }
    return [];
  } catch (e) {
    console.error('Error parsing fichiers:', e);
    return [];
  }
};

  useEffect(() => {
    if (!id) return

    const fetchReclamation = async () => {
      try {
        setLoading(true)
        const headers = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`http://localhost:5000/reclamations/consulter/${id}`, {
          headers,
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            return notFound()
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          // Parse the fichiers properly
          const parsedFichiers = parseFichiers(data.data.fichiers);
          setReclamation({
            ...data.data,
            fichiers: parsedFichiers
          });
          setResponse(data.data.reponse || "")
        } else {
          toast.error("Impossible de récupérer les détails de la réclamation")
          notFound()
        }
      } catch (error) {
        console.error("Error fetching reclamation:", error)
        toast.error("Erreur lors du chargement de la réclamation")
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchReclamation()
  }, [id, token])

  // File handling functions
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newAttachments = files.map((file) => ({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    // Revoke object URL to avoid memory leaks
    if (newAttachments[index].preview) {
      URL.revokeObjectURL(newAttachments[index].preview);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

const handleDownload = async (fileUrl, fileName) => {
  try {
    // Verify the URL is valid and accessible
    const response = await fetch(fileUrl, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('File not accessible');
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error(`Impossible de télécharger ${fileName}: fichier non accessible`);
  }
};

  // Function to get file icon based on type
  const getFileIcon = (fileType, fileName) => {
    if (!fileType) {
      const extension = fileName?.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        return <ImageIcon className="h-4 w-4 mr-1" />;
      }
      return <FileIcon className="h-4 w-4 mr-1" />;
    }
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-1" />;
    }
    return <FileIcon className="h-4 w-4 mr-1" />;
  };

  const FileIconComponent = ({ type }) => {
    if (!type) return <FileIcon className="h-4 w-4" />;
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error("Veuillez écrire une réponse")
      return
    }

    setSubmitting(true)
    try {
      let fileUrls = []

      if (attachments.length > 0) {
        setUploadingFiles(true)
        const formData = new FormData()
        attachments.forEach((attachment) => {
          formData.append("files", attachment.file)
        })

        const headers = {}
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const uploadResponse = await fetch("http://localhost:5000/fichiers/upload", {
          method: "POST",
          headers,
          credentials: "include",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Erreur lors du téléchargement des fichiers")
        }

        const uploadData = await uploadResponse.json()
        if (uploadData.success) {
          fileUrls = uploadData.urls || []
        } else {
          throw new Error(uploadData.message || "Erreur lors du téléchargement des fichiers")
        }

        setUploadingFiles(false)
      }

      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`http://localhost:5000/reclamations/repondre/${id}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          reponse: response,
          fichiers: fileUrls.length > 0 ? fileUrls : undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Réponse envoyée avec succès")
        router.push("/admin/reclamations")
      } else {
        toast.error(data.message || "Erreur lors de l'envoi de la réponse")
      }
    } catch (error) {
      console.error("Error submitting response:", error)
      toast.error("Erreur lors de l'envoi de la réponse")
    } finally {
      setSubmitting(false)
      setUploadingFiles(false)
    }
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`http://localhost:5000/reclamations/sauvegarder-brouillon/${id}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ reponse: response }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Brouillon sauvegardé")
      } else {
        toast.error(data.message || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Erreur lors de la sauvegarde du brouillon")
    } finally {
      setSavingDraft(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée"
    try {
      return format(new Date(dateString), "PPpp", { locale: fr })
    } catch (e) {
      console.error("Error formatting date:", e)
      return dateString
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "nouveau":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700">
            Nouveau
          </Badge>
        )
      case "traite":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            Traité
          </Badge>
        )
      case "archive":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            Archivé
          </Badge>
        )
      case "brouillon":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Brouillon
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <ReclamationDetailSkeleton />
  }

  if (!reclamation) {
    return notFound()
  }

  // Use the properly parsed fichiers from state
  const fichiers = reclamation.fichiers || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-serif">Réclamation {reclamation.reference}</CardTitle>
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
            <div className="bg-secondary/20 p-4 rounded-lg whitespace-pre-line">{reclamation.message}</div>
          </div>

          {fichiers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PaperclipIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Pièces jointes ({fichiers.length})</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {fichiers.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary/30 hover:bg-secondary/50 transition-colors p-2 px-3 rounded-lg text-sm cursor-pointer"
                    onClick={() => handleDownload(file.url, file.name)}
                  >
                    {getFileIcon(file.type, file.name)}
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
                className="min-h-[200px] bg-white border-secondary"
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
                            <FileIconComponent type={file.type} />
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
              className="gap-2"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting || uploadingFiles}
            >
              <SaveIcon className="h-4 w-4" />
              {savingDraft ? "Sauvegarde..." : "Enregistrer comme brouillon"}
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={handleSubmitResponse}
              disabled={submitting || uploadingFiles}
            >
              <SendIcon className="h-4 w-4" />
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
  )
}

function ReclamationDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-24" />
      </div>

      <Card className="border-none shadow-sm bg-white">
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
  )
}