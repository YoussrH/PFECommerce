"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Users, DollarSign, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"

export default function TableauDeBordCoupons() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, isAuthenticated, isAdmin, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/authentification')
      return
    }

    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/coupons/overview", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Non autorisé - Veuillez vous reconnecter")
          }
          throw new Error("Échec du chargement des statistiques des coupons")
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, isAdmin, token, router])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Redirection vers la connexion...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Chargement des statistiques des coupons...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
          {error.includes("Non autorisé") && (
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Aller à la page de connexion
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Aucune donnée disponible</p>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return `${Number.parseFloat(value).toFixed(3)} DT`
  }

  const usagePercentage =
    data.overall.totalCreatedValue !== "0"
      ? ((Number.parseFloat(data.overall.usedValue) / Number.parseFloat(data.overall.totalCreatedValue)) * 100).toFixed(1)
      : "0"

  return (
    <div className="min-h-screen  p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord des statistiques de coupons</h1>
          <p className="text-gray-600">Aperçu de l&apos;utilisation des coupons et des statistiques clients</p>
        </div>

        {/* Cartes de statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des coupons</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.overall.totalCoupons}</div>
              <p className="text-xs text-muted-foreground">{data.overall.activeCouponsCount} actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur totale créée</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.overall.totalCreatedValue)}</div>
              <p className="text-xs text-muted-foreground">Sur tous les coupons</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur utilisée</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.overall.usedValue)}</div>
              <p className="text-xs text-muted-foreground">{usagePercentage}% taux d&apos;utilisation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur active</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.overall.activeCouponsValue)}</div>
              <p className="text-xs text-muted-foreground">Disponible à l&apos;utilisation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des statistiques clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Statistiques clients</CardTitle>
            <p className="text-sm text-gray-600">Détail par client</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total coupons</TableHead>
                    <TableHead className="text-right">Total points</TableHead>
                    <TableHead className="text-right">Points utilisés</TableHead>
                    <TableHead className="text-right">Points actifs</TableHead>
                    <TableHead className="text-right">Taux d&apos;utilisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byClient.map((client) => {
                    const clientUsageRate =
                      Number.parseFloat(client.totalPoints) !== 0
                        ? (
                            (Number.parseFloat(client.usedPoints) / Number.parseFloat(client.totalPoints)) *
                            100
                          ).toFixed(1)
                        : "0"

                    return (
                      <TableRow key={client.client_id}>
                        <TableCell className="font-medium">
                          {client.client.utilisateur.prenom} {client.client.utilisateur.nom}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{client.client.utilisateur.email}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{client.totalCoupons}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(client.totalPoints)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(client.usedPoints)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(client.activePoints)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={Number.parseFloat(clientUsageRate) > 50 ? "default" : "outline"}
                            className={Number.parseFloat(clientUsageRate) > 50 ? "bg-green-100 text-green-800" : ""}
                          >
                            {clientUsageRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pied de page récapitulatif */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
              <p className="text-sm text-gray-600">
                {data.byClient.length} clients avec {data.overall.totalCoupons} coupons au total
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
  )
}