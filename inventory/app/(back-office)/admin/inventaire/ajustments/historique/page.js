"use client"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Search } from "lucide-react"
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/app/contexts/AuthContext'

const ACTION_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'adjustment', label: 'Ajustement simple' },
  { value: 'correction', label: 'Correction' }
]

export default function AdjustmentHistory() {
  const { user, isAdmin, token } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    date: ''
  })

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.search && { search: filters.search.toLowerCase() }),
        ...(filters.date && { date: filters.date })
      });

      const response = await axios.get(
        `http://localhost:5000/ajustements/historique?${params}`,
        { 
         headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          validateStatus: (status) => status < 500
        }
      );

      if (response.status === 200 && response.data.success) {
        setHistory(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        const errorMessage = response.data?.message || 'Erreur de chargement';
        toast.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Erreur de connexion au serveur';
      if (error.response) {
        errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Pas de réponse du serveur';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getBadgeVariant = (type) => {
    switch(type) {
      case 'adjustment': return 'default';
      case 'correction': return 'destructive';
      default: return 'outline';
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchHistory();
    }
  }, [page, filters, isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">
          Les privilèges d&apos;administrateur sont nécessaires
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Historique des ajustements</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU ou raison..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <Select
            value={filters.type}
            onValueChange={(val) => handleFilterChange('type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type d'ajustement" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            placeholder="Filtrer par date"
          />
        </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="text-right">Différence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length > 0 ? (
                      history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(record.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(record.type)}>
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{record.article?.nom_produit || 'N/A'}</div>
                            {record.article?.sku && (
                              <div className="text-xs text-muted-foreground">
                                SKU: {record.article.sku}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.taille?.libelle || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {record.raison === 'Autre' ? record.raison_autre : record.raison}
                          </TableCell>
                          <TableCell>
                            {record.admin?.prenom} {record.admin?.nom}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            record.difference > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {record.difference > 0 ? '+' : ''}{record.difference}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          Aucun ajustement trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-2 mt-4">
                <div className="text-sm text-muted-foreground">
                  {totalItems} résultats au total
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm font-medium">
                      Page {page} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}