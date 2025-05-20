"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRemise } from '@/hooks/useRemise'

export default function GestionRemises() {
  const router = useRouter()
  const { remises, loading, error, fetchRemises, deleteRemise } = useRemise()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')

  useEffect(() => {
    const loadRemises = async () => {
      try {
        await fetchRemises()
      } catch (error) {
        toast.error(error || 'Échec du chargement des remises')
      }
    }

    loadRemises()
  }, [fetchRemises])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const filteredRemises = remises.filter(remise => {
    const matchesSearch = 
      remise.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remise.libelle?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      filterStatus === 'tous' ||
      (filterStatus === 'actives' && remise.est_active) ||
      (filterStatus === 'inactives' && !remise.est_active)
    
    return matchesSearch && matchesStatus
  })

  const handleSupprimerRemise = async (id) => {
    try {
      await deleteRemise(id)
      toast.success('Remise supprimée avec succès')
    } catch (error) {
      toast.error(error || 'Échec de la suppression')
    }
  }

  const formaterDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'PP', { locale: fr })
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Remises</CardTitle>
              <CardDescription>
                Créez et gérez les remises applicables aux produits
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/ventes/remise/nouveau')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle Remise
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes les remises</SelectItem>
                <SelectItem value="actives">Actives</SelectItem>
                <SelectItem value="inactives">Inactives</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Chargement en cours...
                  </TableCell>
                </TableRow>
              ) : filteredRemises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {remises.length === 0 ? 'Aucune remise disponible' : 'Aucune remise ne correspond aux critères'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRemises.map((remise) => (
                  <TableRow key={remise.id}>
                    <TableCell className="font-medium">{remise.code}</TableCell>
                    <TableCell>{remise.libelle}</TableCell>
                    <TableCell>
                      {remise.type_remise === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'}
                    </TableCell>
                    <TableCell>
                      {remise.type_remise === 'pourcentage' 
                        ? `${remise.valeur} %` 
                        : `${remise.valeur} DT`}
                    </TableCell>
                    <TableCell>
                      {formaterDate(remise.date_debut)} - {formaterDate(remise.date_fin)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={remise.est_active ? 'default' : 'secondary'}>
                        {remise.est_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => router.push(`/admin/ventes/remise/editer/${remise.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => handleSupprimerRemise(remise.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}