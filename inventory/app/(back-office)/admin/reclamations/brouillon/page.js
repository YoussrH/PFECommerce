"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PencilIcon, TrashIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DraftReclamations() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [draftToDelete, setDraftToDelete] = useState(null)
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true)
        const headers = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch("http://localhost:5000/reclamations/lister?statut=brouillon", {
          headers,
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setDrafts(data.data)
        } else {
          toast.error("Impossible de récupérer les brouillons")
        }
      } catch (error) {
        console.error("Error fetching drafts:", error)
        toast.error("Erreur lors du chargement des brouillons")
      } finally {
        setLoading(false)
      }
    }

    fetchDrafts()
  }, [token])

  const handleDelete = async (id) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`http://localhost:5000/reclamations/supprimer/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Brouillon supprimé avec succès")
        setDrafts(drafts.filter((draft) => draft.id !== id))
      } else {
        toast.error(data.message || "Échec de la suppression")
      }
    } catch (error) {
      console.error("Error deleting reclamation:", error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setDraftToDelete(null)
    }
  }

  if (loading) {
    return <ReclamationsTableSkeleton />
  }

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Brouillons</h2>
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-secondary mb-4">
              <FileEditIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Aucun brouillon</h3>
            <p className="text-muted-foreground">Les réclamations en cours de rédaction apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-medium">Référence</TableHead>
                  <TableHead className="font-medium">Sujet</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Date de modification</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id} className="hover:bg-secondary/20">
                    <TableCell className="font-medium">{draft.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{draft.sujet}</TableCell>
                    <TableCell>
                      {draft.prefix} {draft.prenom} {draft.nom}
                    </TableCell>
                    <TableCell>
                      {format(new Date(draft.date_modification), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Brouillon
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => router.push(`/admin/reclamations/consulter/${draft.id}`)}
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Continuer
                        </Button>

                        <AlertDialog
                          open={draftToDelete === draft.id}
                          onOpenChange={(open) => !open && setDraftToDelete(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => setDraftToDelete(draft.id)}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(draft.id)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReclamationsTableSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function FileEditIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
    </svg>
  )
}
