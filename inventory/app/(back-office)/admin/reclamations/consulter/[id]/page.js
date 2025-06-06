"use client";

import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ViewReclamation({ params }) {
  const { id } = use(params);
  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const router = useRouter();
  const { token, user } = useAuth();

  // Parse fichiers array from string or object
  const parseFichiers = (fichiers) => {
    try {
      if (!fichiers) return [];
      if (Array.isArray(fichiers)) return fichiers;

      if (typeof fichiers === "string") {
        try {
          // Try direct parse
          const parsed = JSON.parse(fichiers);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // Try cleaning string if parse fails
          const cleaned = fichiers.replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/^"|"$/g, "");
          const parsed = JSON.parse(cleaned);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
      }
      return [];
    } catch (e) {
      console.error("Error parsing fichiers:", e);
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
      if (fileUrl.includes("res.cloudinary.com")) {
        let downloadUrl = fileUrl;

        // Check if this is an authenticated resource
        const isAuthenticated = fileUrl.includes("/authenticated/");

        // For authenticated files, get signed URL from backend
        if (isAuthenticated) {
          const response = await fetch("http://localhost:5000/reclamations/signed-url", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
            body: JSON.stringify({ fileUrl }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to get secure download URL");
          }

          const { signedUrl } = await response.json();
          downloadUrl = signedUrl;
        }

        // Add force download parameter
        downloadUrl = downloadUrl.includes("?")
          ? `${downloadUrl}&fl_attachment=${encodeURIComponent(fileName || "file")}`
          : `${downloadUrl}?fl_attachment=${encodeURIComponent(fileName || "file")}`;

        // Create temporary link
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName || "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
        return;
      }

      // For non-Cloudinary files
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Download failed:", {
        error: error.message,
        stack: error.stack,
        fileUrl,
        fileName,
        fileType,
      });
      toast.error(`Échec du téléchargement: ${error.message || "Erreur inconnue"}`);
    }
  };
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter((file) => {
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
            // 'Content-Type': 'multipart/form-data' // Important: Do NOT set Content-Type header manually for FormData
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
          "Content-Type": "application/json",
        },
        withCredentials: true,
        credentials: "include",
        body: JSON.stringify({
          reponse: response,
          fichiers: fileUrls,
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
          "Content-Type": "application/json",
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
        return <Badge className="bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full">Nouveau</Badge>;
      case "traite":
        return <Badge className="bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full">Traité</Badge>;
      case "archive":
        return <Badge className="bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full">Archivé</Badge>;
      case "brouillon":
        return <Badge className="bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10 px-2.5 py-0.5 text-xs font-medium rounded-full">Brouillon</Badge>;
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
            fichiers: parsedFichiers,
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
  }, [id, token, user]); // Added user to dependency array

  // Clean up object URLs
  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
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
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card className="shadow-lg border-gray-100 rounded-xl">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-gray-900">Réclamation #{reclamation.reference}</CardTitle>
              <p className="text-gray-600 text-base">{reclamation.sujet}</p>
            </div>
            <div>{getStatusBadge(reclamation.statut)}</div>
          </div>
        </CardHeader>

        <CardContent className="p-6 grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client</h3>
                  <p className="font-semibold text-gray-800">
                    {reclamation.prefix} {reclamation.prenom} {reclamation.nom}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                  <MailIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="font-semibold text-gray-800">{reclamation.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                  <PhoneIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                  <p className="font-semibold text-gray-800">{reclamation.telephone || "Non spécifié"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                  <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Commande</h3>
                  <p className="font-semibold text-gray-800">{reclamation.numero_commande || "Non spécifiée"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date de création</h3>
                  <p className="font-semibold text-gray-800">{formatDate(reclamation.date_creation)}</p>
                </div>
              </div>

              {reclamation.date_reponse && (
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date de réponse</h3>
                    <p className="font-semibold text-gray-800">{formatDate(reclamation.date_reponse)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Message du client</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-line text-gray-700 leading-relaxed">
              {reclamation.message}
            </div>
          </div>

          {reclamation.fichiers?.length > 0 && (
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <PaperclipIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Pièces jointes ({reclamation.fichiers.length})</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {reclamation.fichiers.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 transition-colors p-2 px-3 rounded-lg text-sm cursor-pointer border border-gray-200"
                    onClick={() => handleDownload(file.url, file.name, file.type)}
                  >
                    {file.type?.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="truncate max-w-[150px] text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">{file.size}</span>
                    <DownloadIcon className="h-4 w-4 ml-1 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reclamation.statut !== "archive" && (
            <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Votre réponse</h3>
              </div>
              <Textarea
                placeholder="Écrivez votre réponse ici..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="min-h-[200px] border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2"> {/* Added justify-between */}
                  <div className="flex items-center gap-2">
                    <PaperclipIcon className="h-5 w-5 text-blue-600" />
                    <Label htmlFor="file-upload" className="font-medium text-gray-800 cursor-pointer">
                      Joindre des fichiers
                    </Label>
                  </div>
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
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded-md"
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    Parcourir
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Fichiers à joindre ({attachments.length})</h4>
                    <div className="grid gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon className="h-4 w-4 text-gray-600" />
                            ) : (
                              <FileIcon className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="text-sm truncate text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">{file.size}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-50"
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
          <CardFooter className="p-6 pt-0 flex justify-end gap-3 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting || uploadingFiles}
              className="text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {savingDraft ? "Sauvegarde..." : "Enregistrer comme brouillon"}
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={submitting || uploadingFiles}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors duration-200"
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
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <Card className="shadow-lg border-gray-100 rounded-xl">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-7 w-64 rounded-md" />
              <Skeleton className="h-5 w-80 rounded-md" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>

        <CardContent className="p-6 grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-5 w-40 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-5 w-40 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <Skeleton className="h-6 w-40 rounded-md" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex justify-end gap-3 border-t border-gray-200">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}