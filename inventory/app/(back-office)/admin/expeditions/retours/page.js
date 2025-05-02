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
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

export default function RetoursPage() {
  const { retours, loading, fetchRetours, processReturn } = useExpeditionsStore()
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    statut: 'all',
    type: 'all'
  })
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [decision, setDecision] = useState('accepter')
  const [motifRefus, setMotifRefus] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchRetours(filters)
  }, [filters])

  const handleProcessReturn = async () => {
    try {
      await processReturn({
        id: selectedReturn.id,
        decision,
        motif_refus,
        notes
      })
      setOpenDialog(false)
      setSelectedReturn(null)
      setDecision('accepter')
      setMotifRefus('')
      setNotes('')
    } catch (error) {
      console.error('Failed to process return:', error)
    }
  }

  const statusBadgeVariant = {
    'En cours': 'secondary',
    'Accepté': 'success',
    'Refusé': 'destructive',
    'Clôturé': 'default'
  }

  const typeBadgeVariant = {
    'Retour simple': 'outline',
    'Remplacement': 'secondary',
    'Remboursement': 'default'
  }

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Retours</CardTitle>
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
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Accepté">Accepté</SelectItem>
                <SelectItem value="Refusé">Refusé</SelectItem>
                <SelectItem value="Clôturé">Clôturé</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.type} 
              onValueChange={(value) => setFilters({...filters, type: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Retour simple">Retour simple</SelectItem>
                <SelectItem value="Remplacement">Remplacement</SelectItem>
                <SelectItem value="Remboursement">Remboursement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date Demande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : retours.length > 0 ? (
                  retours.map((retour) => (
                    <TableRow key={retour.id}>
                      <TableCell>{retour.commande?.reference}</TableCell>
                      <TableCell>
                        <Badge variant={typeBadgeVariant[retour.type]}>
                          {retour.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[retour.statut]}>
                          {retour.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(retour.date_demande)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={retour.statut === 'En cours' ? 'default' : 'outline'}
                          disabled={retour.statut !== 'En cours'}
                          onClick={() => {
                            setSelectedReturn(retour)
                            setOpenDialog(true)
                          }}
                        >
                          {retour.statut === 'En cours' ? 'Traiter' : 'Déjà traité'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Aucun retour trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traiter le retour #{selectedReturn?.commande?.reference}</DialogTitle>
            <DialogDescription>
              {selectedReturn?.type} - {selectedReturn?.motif?.substring(0, 100)}...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Décision</Label>
              <RadioGroup 
                value={decision} 
                onValueChange={setDecision}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accepter" id="accepter" />
                  <Label htmlFor="accepter">Accepter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="refuser" id="refuser" />
                  <Label htmlFor="refuser">Refuser</Label>
                </div>
              </RadioGroup>
            </div>

            {decision === 'refuser' && (
              <div>
                <Label>Motif de refus</Label>
                <Textarea
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  placeholder="Raison du refus..."
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Notes supplémentaires</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes internes..."
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleProcessReturn}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}