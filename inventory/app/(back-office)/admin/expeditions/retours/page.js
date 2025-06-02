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
import { ArrowLeft, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function RetoursPage() {
  const { 
    retours, 
    loading, 
    stats = {
      totalRetours: 0,
      enCours: 0,
      acceptes: 0,
      refuses: 0,
      clotures: 0
    },
    fetchRetours, 
    processReturn 
  } = useExpeditionsStore()
  // lib/utils.js
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
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
        motif_refus: motifRefus,
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

  const statusIcons = {
    'En cours': <Clock className="h-4 w-4 mr-2" />,
    'Accepté': <CheckCircle className="h-4 w-4 mr-2" />,
    'Refusé': <XCircle className="h-4 w-4 mr-2" />,
    'Clôturé': <CheckCircle className="h-4 w-4 mr-2" />
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Retours</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRetours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusés</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.refuses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clôturés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clotures}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Liste des Retours</CardTitle>
            <div className="flex items-center gap-4">
              <Select 
                value={filters.statut} 
                onValueChange={(value) => setFilters({...filters, statut: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_preparation">En cours</SelectItem>
                  <SelectItem value="approuve">Accepté</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                  <SelectItem value="traite">Clôturé</SelectItem>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date Demande</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Chargement des retours...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : retours.length > 0 ? (
                  retours.map((retour) => (
                    <TableRow key={retour.id}>
                      <TableCell className="font-medium">
                        {retour.commande?.reference}
                      </TableCell>
                      <TableCell>
                        {retour.commande?.client?.utilisateur?.prenom} {retour.commande?.client?.utilisateur?.nom}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeBadgeVariant[retour.type]}>
                          {retour.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusBadgeVariant[retour.statut]} 
                          className="flex items-center"
                        >
                          {statusIcons[retour.statut]}
                          {retour.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(retour.date_demande)}
                      </TableCell>
                      <TableCell className="text-right">
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
                    <TableCell colSpan={6} className="text-center py-4">
                      Aucun retour trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-white rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold">Récapitulatif</h3>
            <p className="text-sm text-gray-600">
              {retours.length} retours affichés
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilters({...filters, page: filters.page + 1})}
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Dernière mise à jour</p>
              <p className="text-sm font-medium">{new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Return Dialog */}
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