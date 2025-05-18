'use client'
import { useEffect, useState } from 'react'
import { useExpeditionsStore } from '@/hooks/useExpeditionsStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ExpeditionsPage() {
  const { expeditions, loading, fetchExpeditions, updateExpeditionStatus } = useExpeditionsStore()
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    statut: 'all',
    livreur_id: '',
  })

  // Date formatting function directly in the component
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchExpeditions(filters)
  }, [filters])

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateExpeditionStatus({
        id,
        statut_expedition: newStatus,
        notes: 'Statut modifié depuis le tableau de bord'
      })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const statusBadgeVariant = {
    'Préparée': 'secondary',
    'En route': 'default',
    'Livrée': 'success',
    'Échec de livraison': 'destructive'
  }

  return (
    <div className="container mx-auto p-6">
        <CardHeader>
          <CardTitle>Suivi des Expéditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select 
              value={filters.statut} 
              onValueChange={(value) => setFilters({...filters, statut: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Préparée">Préparée</SelectItem>
                <SelectItem value="En route">En route</SelectItem>
                <SelectItem value="Livrée">Livrée</SelectItem>
                <SelectItem value="Échec de livraison">Échec</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filtrer par livreur"
              value={filters.livreur_id}
              onChange={(e) => setFilters({...filters, livreur_id: e.target.value})}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date Expédition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : expeditions.length > 0 ? (
                  expeditions.map((expedition) => (
                    <TableRow key={expedition.id}>
                      <TableCell>{expedition.reference}</TableCell>
                      <TableCell>
                        {expedition.client?.utilisateur?.prenom} {expedition.client?.utilisateur?.nom}
                      </TableCell>
                      <TableCell>
                        {expedition.livreur?.utilisateur?.prenom || 'Non assigné'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[expedition.statut_expedition]}>
                          {expedition.statut_expedition}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(expedition.date_expedition)}</TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Aucune expédition trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
    </div>
  )
}