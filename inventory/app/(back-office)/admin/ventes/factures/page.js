'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchIcon, CalendarIcon, DownloadIcon, Loader2, Activity, DollarSign, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useFactures from "@/hooks/useFactures";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function FacturesPage() {
  const {
    factures,
    loading,
    error,
    stats,
    pagination,
    filters,
    downloadFacture,
    updateFilters,
    changePage,
    statusColors,
    statusLabels
  } = useFactures();

  const handleStatusChange = (value) => {
    updateFilters({ statut: value });
  };

  const handleSearch = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleDateChange = (date) => {
    updateFilters({ 
      dateFrom: date?.from?.toISOString().split('T')[0] || '',
      dateTo: date?.to?.toISOString().split('T')[0] || ''
    });
  };

  const dateRange = {
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined
  };

  return (
    <div className="min-h-screen  p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Factures</h1>
          <p className="text-gray-600">Aperçu des factures et statistiques de vente</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFactures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.montantTotal.toFixed(3)} DT</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnAttente}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-[400px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              className="pl-8 w-full"
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: fr })
                    )
                  ) : (
                    <span>Choisir une période</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            <Select value={filters.statut} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="livree">Livrées</SelectItem>
                <SelectItem value="en_preparation">En préparation</SelectItem>
                <SelectItem value="annulee">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Liste des Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Chargement des factures...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-red-500 py-4">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : factures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Aucune facture trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    factures.map((facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="font-medium">{facture.commande_ref}</TableCell>
                        <TableCell>{facture.client}</TableCell>
                        <TableCell className="text-right">{facture.montant.toFixed(3)} DT</TableCell>
                        <TableCell>{facture.date}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[facture.statut]} text-white`}>
                            {statusLabels[facture.statut]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadFacture(facture.id)}
                          >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            PDF
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => changePage(pagination.page - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm">
              Page {pagination.page} sur {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => changePage(pagination.page + 1)}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Summary Footer */}
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
              <p className="text-sm text-gray-600">
                {factures.length} factures affichées sur {stats.totalFactures} au total
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Dernière mise à jour</p>
              <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}