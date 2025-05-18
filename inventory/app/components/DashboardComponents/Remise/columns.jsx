// app/admin/remises/columns.jsx
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export const columns = (handleDelete) => [
  {
    accessorKey: "nom",
    header: "Nom",
    cell: ({ row }) => (
      <Link href={`/admin/remises/${row.original.id}`} className="font-medium hover:underline">
        {row.getValue("nom")}
      </Link>
    )
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type")
      return (
        <Badge variant="outline">
          {type === 'pourcentage' ? 'Pourcentage' : 
           type === 'fixe' ? 'Montant fixe' : 
           'Quantité'}
        </Badge>
      )
    }
  },
  {
    accessorKey: "valeur",
    header: "Valeur",
    cell: ({ row }) => {
      const type = row.original.type
      const valeur = row.getValue("valeur")
      return type === 'pourcentage' ? `${valeur}%` : `${valeur} DT`
    }
  },
  {
    accessorKey: "date_debut",
    header: "Début",
    cell: ({ row }) => format(new Date(row.getValue("date_debut")), "dd/MM/yyyy")
  },
  {
    accessorKey: "date_fin",
    header: "Fin",
    cell: ({ row }) => row.getValue("date_fin") ? 
      format(new Date(row.getValue("date_fin")), "dd/MM/yyyy") : 'Indéfinie'
  },
  {
    accessorKey: "actif",
    header: "Statut",
    cell: ({ row }) => {
      const now = new Date()
      const debut = new Date(row.original.date_debut)
      const fin = row.original.date_fin ? new Date(row.original.date_fin) : null
      
      const isActive = now >= debut && (!fin || now <= fin)
      
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Supprimer
          </Button>
        </div>
      )
    },
  },
]