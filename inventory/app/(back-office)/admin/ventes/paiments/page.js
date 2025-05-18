'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchIcon, CalendarIcon, FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import usePaiements from "@/hooks/usePaiements";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PaiementsPage() {
  const {
    paiements,
    loading,
    error,
    stats,
    pagination,
    filters,
    updateFilters,
    changePage,
    paymentMethods,
    statusColors,
    statusIcons
  } = usePaiements();

  const handleStatusChange = (value) => {
    updateFilters({ statut: value });
  };

  const handleSearch = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleDateChange = (date) => {
    if (date) {
      updateFilters({ 
        dateFrom: date.from?.toISOString().split('T')[0] || '',
        dateTo: date.to?.toISOString().split('T')[0] || ''
      });
    } else {
      updateFilters({ dateFrom: '', dateTo: '' });
    }
  };

  const dateRange = {
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPaiements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montantTotal.toFixed(2)} TND</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retournés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRetournes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Reçus de Paiement</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className="w-[260px] justify-start text-left font-normal"
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
              <SelectValue placeholder="Tous les paiements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les paiements</SelectItem>
              <SelectItem value="livree">Payés</SelectItem>
              <SelectItem value="retourne">Retournés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Historique des Paiements</CardTitle>
            <div className="relative w-full md:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un paiement..."
                className="pl-8 w-full md:w-[300px]"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Date Paiement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-red-500 py-4">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paiements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paiements.map((paiement) => (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-medium">{paiement.commande_ref}</TableCell>
                    <TableCell>{paiement.client}</TableCell>
                    <TableCell className="text-right">{paiement.montant.toFixed(2)} TND</TableCell>
                    <TableCell>{paymentMethods[paiement.methode] || paiement.methode}</TableCell>
                    <TableCell>{paiement.date_paiement}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusColors[paiement.statut]} text-white`}>
                          {paiement.statut === "livree" ? "Payé" : "Retourné"}
                        </Badge>
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
  );
}