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
import { SearchIcon, FilterIcon, EyeIcon, RefreshCwIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ArchivedReclamations() {
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        setLoading(true)
        const headers = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch("http://localhost:5000/reclamations/lister?statut=archive", {
          headers,
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setArchived(data.data)
        } else {
          toast.error("Impossible de récupérer les réclamations archivées")
        }
      } catch (error) {
        console.error("Error fetching archived reclamations:", error)
        toast.error("Erreur lors du chargement des réclamations archivées")
      } finally {
        setLoading(false)
      }
    }

    fetchArchived()
  }, [token])

  const handleRestore = async (id) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`http://localhost:5000/reclamations/restaurer/${id}`, {
        method: "POST",
        headers,
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Réclamation restaurée avec succès")
        setArchived(archived.filter((item) => item.id !== id))
      } else {
        toast.error(data.message || "Échec de la restauration")
      }
    } catch (error) {
      console.error("Error restoring reclamation:", error)
      toast.error("Erreur lors de la restauration")
    }
  }

  const filteredArchived = archived.filter(
    (item) =>
      item.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <ReclamationsTableSkeleton />
  }

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-medium">Réclamations archivées</h2>
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

        {filteredArchived.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-secondary mb-4">
              <ArchiveBoxIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Aucune réclamation archivée</h3>
            <p className="text-muted-foreground">Les réclamations archivées apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                  <TableHead className="font-medium">Référence</TableHead>
                  <TableHead className="font-medium">Sujet</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Date création</TableHead>
                  <TableHead className="font-medium">Date clôture</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArchived.map((item) => (
                  <TableRow key={item.id} className="hover:bg-secondary/20">
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.sujet}</TableCell>
                    <TableCell>
                      {item.prefix} {item.prenom} {item.nom}
                    </TableCell>
                    <TableCell>{format(new Date(item.date_creation), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      {item.date_reponse
                        ? format(new Date(item.date_reponse), "dd/MM/yyyy", { locale: fr })
                        : "Non spécifiée"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                        Archivé
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => router.push(`/admin/reclamations/consulter/${item.id}`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Consulter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleRestore(item.id)}
                        >
                          <RefreshCwIcon className="h-4 w-4 mr-1" />
                          Restaurer
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

function ArchiveBoxIcon(props) {
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
      <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z" />
      <path d="m3.09 8.84 12.35-6.61a1.93 1.93 0 0 1 1.81 0l3.65 1.9a2.12 2.12 0 0 1 .1 3.69L8.73 14.75a2 2 0 0 1-1.94 0L3 12.51a2.12 2.12 0 0 1 .09-3.67Z" />
      <line x1="12" x2="12" y1="22" y2="13" />
      <path d="M20 13.5v3.37a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13.5" />
    </svg>
  )
}
