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
import { formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function ColisPage() {
  const { colis, loading, fetchColis, manageColis } = useExpeditionsStore()
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    statut: 'all',
    commande_id: ''
  })
  const [openDialog, setOpenDialog] = useState(false)
  const [currentColis, setCurrentColis] = useState(null)
  const [formData, setFormData] = useState({
    commande_id: '',
    poids: '',
    dimensions: '',
    contenu: '',
    livreur_id: ''
  })

  useEffect(() => {
    fetchColis(filters)
  }, [filters])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await manageColis({
        id: currentColis?.id,
        ...formData
      })
      setOpenDialog(false)
      setCurrentColis(null)
      setFormData({
        commande_id: '',
        poids: '',
        dimensions: '',
        contenu: '',
        livreur_id: ''
      })
    } catch (error) {
      console.error('Failed to manage package:', error)
    }
  }

  const statusBadgeVariant = {
    'En préparation': 'secondary',
    'Prêt à expédier': 'default',
    'Expédié': 'success'
  }

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Colis</CardTitle>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentColis(null)}>
                Nouveau Colis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentColis ? 'Modifier le colis' : 'Créer un nouveau colis'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>N° Commande</Label>
                  <Input
                    value={formData.commande_id}
                    onChange={(e) => setFormData({...formData, commande_id: e.target.value})}
                    placeholder="Référence de la commande"
                    required
                  />
                </div>
                <div>
                  <Label>Poids (kg)</Label>
                  <Input
                    type="number"
                    value={formData.poids}
                    onChange={(e) => setFormData({...formData, poids: e.target.value})}
                    placeholder="Poids en kilogrammes"
                    required
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Dimensions (L x l x H)</Label>
                  <Input
                    value={formData.dimensions}
                    onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                    placeholder="Ex: 30x20x15 cm"
                    required
                  />
                </div>
                <div>
                  <Label>Contenu</Label>
                  <Input
                    value={formData.contenu}
                    onChange={(e) => setFormData({...formData, contenu: e.target.value})}
                    placeholder="Description du contenu"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {currentColis ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                <SelectItem value="En préparation">En préparation</SelectItem>
                <SelectItem value="Prêt à expédier">Prêt à expédier</SelectItem>
                <SelectItem value="Expédié">Expédié</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filtrer par commande"
              value={filters.commande_id}
              onChange={(e) => setFilters({...filters, commande_id: e.target.value})}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code Colis</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Poids (kg)</TableHead>
                  <TableHead>Date Expédition</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : colis.length > 0 ? (
                  colis.map((colis) => (
                    <TableRow key={colis.id}>
                      <TableCell>{colis.code_colis}</TableCell>
                      <TableCell>{colis.commande?.reference}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[colis.statut]}>
                          {colis.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>{colis.poids}</TableCell>
                      <TableCell>{formatDate(colis.date_expedition)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentColis(colis)
                            setFormData({
                              commande_id: colis.commande_id,
                              poids: colis.poids,
                              dimensions: colis.dimensions,
                              contenu: colis.contenu,
                              livreur_id: colis.livreur_id
                            })
                            setOpenDialog(true)
                          }}
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Aucun colis trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}