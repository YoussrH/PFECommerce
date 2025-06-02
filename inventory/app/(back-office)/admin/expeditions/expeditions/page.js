'use client';
import { useEffect, useState } from 'react';
import { useExpeditionsStore } from '@/hooks/useExpeditionsStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Truck, Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExpeditionsPage() {
  const { 
    expeditions = [], 
    loading, 
    stats = {
      totalExpeditions: 0,
      enPreparation: 0,
      enRoute: 0,
      livrees: 0,
      echecs: 0
    },
    fetchExpeditions, 
    updateExpeditionStatus 
  } = useExpeditionsStore();
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    statut: 'all',
    livreur_id: '',
  });

  // Format date in French locale
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchExpeditions(filters);
  }, [filters, fetchExpeditions]);

  const handleStatusChange = async (id) => {
    try {
      await updateExpeditionStatus({
        id,
        statut_expedition: 'Livrée',
        notes: 'Marqué comme livré via le dashboard'
      });
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
    }
  };

  // Status styling configuration
  const statusConfig = {
    'Préparée': { 
      variant: 'secondary',
      icon: <Package className="h-4 w-4 mr-2" />
    },
    'En route': { 
      variant: 'default',
      icon: <Truck className="h-4 w-4 mr-2" />
    },
    'Livrée': { 
      variant: 'success',
      icon: <CheckCircle className="h-4 w-4 mr-2" />
    },
    'Échec de livraison': { 
      variant: 'destructive',
      icon: <AlertCircle className="h-4 w-4 mr-2" />
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi des Expéditions</h1>
          <p className="text-gray-600">Aperçu des expéditions et suivi des livraisons</p>
        </div>

        {/* Stats Cards - Always show total numbers (unfiltered) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={`loading-${i}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expéditions</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalExpeditions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enPreparation}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enRoute}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Livrées</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.livrees}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters and Table - Shows filtered results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Liste des Expéditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Select 
                  value={filters.statut} 
                  onValueChange={(value) => setFilters({...filters, statut: value})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_preparation">Préparée</SelectItem>
                    <SelectItem value="expediee">En route</SelectItem>
                    <SelectItem value="livree">Livrée</SelectItem>
                    <SelectItem value="retourne">Échec</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filtrer par livreur"
                  value={filters.livreur_id}
                  onChange={(e) => setFilters({...filters, livreur_id: e.target.value})}
                  className="w-full md:w-[300px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Expédition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && expeditions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Chargement des expéditions...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : expeditions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Aucune expédition trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    expeditions.map((expedition) => (
                      <TableRow key={expedition.id}>
                        <TableCell className="font-medium">{expedition.reference}</TableCell>
                        <TableCell>
                          {expedition.client?.utilisateur?.prenom} {expedition.client?.utilisateur?.nom}
                        </TableCell>
                        <TableCell>
                          {expedition.livreur?.utilisateur?.prenom || 'Non assigné'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusConfig[expedition.statut_expedition]?.variant || 'default'} 
                            className="flex items-center"
                          >
                            {statusConfig[expedition.statut_expedition]?.icon}
                            {expedition.statut_expedition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(expedition.date_expedition || expedition.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(expedition.id)}
                            disabled={expedition.statut_expedition === 'Livrée'}
                          >
                            Marquer comme livrée
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer - Shows filtered count */}
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
              <p className="text-sm text-gray-600">
                {expeditions.length} expéditions affichées
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Dernière mise à jour</p>
              <p className="text-sm font-medium">{new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}