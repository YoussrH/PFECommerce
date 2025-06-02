'use client'
import { useEffect, useState } from 'react'
import { useExpeditionsStore } from '@/hooks/useExpeditionsStore'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCommandesStore } from '@/hooks/useCommandesStore'
import { Package, Truck, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const statusVariant = {
  preparation: 'secondary',
  expediee: 'default',
  livre: 'success',
  retourne: 'destructive',
  annulee: 'destructive'
}

const statusIcons = {
  preparation: <Package className="h-4 w-4 mr-2" />,
  expediee: <Truck className="h-4 w-4 mr-2" />,
  livre: <CheckCircle className="h-4 w-4 mr-2" />,
  retourne: <AlertCircle className="h-4 w-4 mr-2" />,
  annulee: <XCircle className="h-4 w-4 mr-2" />
}

export default function ColisPage() {
  const { 
    colis, 
    loading, 
    stats = {
      totalColis: 0,
      enPreparation: 0,
      expediees: 0,
      livrees: 0,
      retournees: 0,
      annulees: 0
    },
    fetchColis 
  } = useExpeditionsStore()
  
  const { generateColisInvoice } = useCommandesStore()
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    statut: 'all',
    commande_id: ''
  })

  useEffect(() => {
    fetchColis(filters)
  }, [filters])

  const handleDownloadColisInvoice = async (colisId) => {
    try {
      await generateColisInvoice(colisId)
    } catch (error) {
      console.error('Failed to generate colis invoice:', error)
    }
  }

  // Ensure stats are numbers and fallback to 0 if undefined/NaN
  const safeStats = {
    totalColis: Number(stats.totalColis) || 0,
    enPreparation: Number(stats.enPreparation) || 0,
    expediees: Number(stats.expediees) || 0,
    livrees: Number(stats.livrees) || 0,
    retournees: Number(stats.retournees) || 0,
    annulees: Number(stats.annulees) || 0
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Colis</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Colis</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.totalColis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.enPreparation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expédiés</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.expediees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.livrees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retournés/Annulés</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.retournees + safeStats.annulees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Colis List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Liste des Colis</CardTitle>
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
                  <SelectItem value="en_preparation">En préparation</SelectItem>
                  <SelectItem value="expediee">Expédié</SelectItem>
                  <SelectItem value="livree">Livré</SelectItem>
                  <SelectItem value="retourne">Retourné</SelectItem>
                  <SelectItem value="remplacee">Remplacée</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filtrer par commande"
                value={filters.commande_id}
                onChange={(e) => setFilters({...filters, commande_id: e.target.value})}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Chargement des colis...</div>
            ) : colis.length > 0 ? (
              colis.map((colis) => (
                <Card key={colis.id} className="border rounded-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <h3 className="font-medium">Colis #{colis.numero_suivi}</h3>
                      <p className="text-sm text-gray-500">
                        Commande: {colis.commande?.reference || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={statusVariant[colis.statut]} className="flex items-center">
                      {statusIcons[colis.statut]}
                      {colis.statut}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Client</p>
                        <p className="text-sm">
                          {colis.commande?.client?.utilisateur?.prenom || 'N/A'} {colis.commande?.client?.utilisateur?.nom || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Transporteur</p>
                        <p className="text-sm">
                          {colis.transporteur || 'Non spécifié'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date création</p>
                        <p className="text-sm">
                          {formatDate(colis.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {colis.qr_code_data && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Voir QR Code
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>QR Code du Colis #{colis.numero_suivi}</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center">
                              <img 
                                src={colis.qr_code_data} 
                                alt={`QR Code for package ${colis.numero_suivi}`}
                                className="w-64 h-64 border rounded"
                              />
                              <p className="mt-4 text-sm">
                                Numéro de suivi: <strong>{colis.numero_suivi}</strong>
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadColisInvoice(colis.id)}
                      >
                        Télécharger Facture Colis
                      </Button>

                      {colis.commande_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/admin/ventes/commandes/gere/${colis.commande_id}`, '_blank')}
                        >
                          Voir Commande
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">Aucun colis trouvé</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-white rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold">Récapitulatif</h3>
            <p className="text-sm text-gray-600">
              {colis.length} colis affichés
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Dernière mise à jour</p>
            <p className="text-sm font-medium">{new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}