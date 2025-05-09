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
  retourne: 'destructive'
}

export default function ColisPage() {
  const { colis, loading, fetchColis } = useExpeditionsStore()
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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Colis</CardTitle>
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
                <SelectItem value="preparation">En préparation</SelectItem>
                <SelectItem value="expediee">Expédié</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="retourne">Retourné</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filtrer par commande"
              value={filters.commande_id}
              onChange={(e) => setFilters({...filters, commande_id: e.target.value})}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center">Chargement...</div>
            ) : colis.length > 0 ? (
              colis.map((colis) => (
                <Card key={colis.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <h3 className="font-medium">Colis #{colis.numero_suivi}</h3>
                      <p className="text-sm text-gray-500">
                        Commande: {colis.commande?.reference || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={statusVariant[colis.statut]}>
                      {colis.statut}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
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

                    <div className="flex gap-2 mt-4">
                      {/* QR Code Display */}
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

                      {/* Download Colis Invoice Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadColisInvoice(colis.id)}
                      >
                        Télécharger Facture Colis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center">Aucun colis trouvé</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}