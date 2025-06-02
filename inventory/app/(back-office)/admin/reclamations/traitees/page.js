"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { SearchIcon, FilterIcon, EyeIcon, ArchiveIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProcessedReclamations() {
  const [processed, setProcessed] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { token ,user} = useAuth()

  useEffect(() => {
    const fetchProcessed = async () => {
      try {
        setLoading(true)


        const response = await fetch("http://localhost:5000/reclamations/lister?statut=traite", {
           headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setProcessed(data.data)
        } else {
          toast.error("Impossible de récupérer les réclamations traitées")
        }
      } catch (error) {
        console.error("Error fetching processed reclamations:", error)
        toast.error("Erreur lors du chargement des réclamations traitées")
      } finally {
        setLoading(false)
      }
    }

    fetchProcessed()
  }, [token])

  const handleArchive = async (id) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`http://localhost:5000/reclamations/archiver/${id}`, {
        method: "POST",
        headers,
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Réclamation archivée avec succès")
        setProcessed(processed.filter((item) => item.id !== id))
      } else {
        toast.error(data.message || "Échec de l'archivage")
      }
    } catch (error) {
      console.error("Error archiving reclamation:", error)
      toast.error("Erreur lors de l'archivage")
    }
  }

  const filteredProcessed = processed.filter(
    (item) =>
      item.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr })
    } catch (e) {
      console.error("Error formatting date:", e)
      return dateString
    }
  }

  if (loading) {
    return <ReclamationsTableSkeleton />
  }

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-medium">Réclamations traitées</h2>
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filteredProcessed.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-secondary mb-4">
              <CheckIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Aucune réclamation traitée</h3>
            <p className="text-muted-foreground">Toutes les réclamations sont en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-medium">Référence</TableHead>
                  <TableHead className="font-medium">Sujet</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Date de traitement</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium">Résolution</TableHead>
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcessed.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20">
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.sujet}</TableCell>
                    <TableCell>
                      {item.prefix} {item.prenom} {item.nom}
                    </TableCell>
                    <TableCell>{formatDate(item.date_reponse)}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                        Traité
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.resolution || "Non spécifiée"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => router.push(`/admin/reclamations/consulter/${item.id}`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleArchive(item.id)}
                        >
                          <ArchiveIcon className="h-4 w-4 mr-1" />
                          Archiver
                        </Button>
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
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function CheckIcon(props) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
