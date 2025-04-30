'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function UtilisateursPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/utilisateurs/obtenirTousUtilisateurs?limit=1');
        const data = await response.json();
        
        if (data.success) {
          // In a real app, you'd have a dedicated stats endpoint
          const clients = data.data.filter(u => u.role === 'client').length;
          const livreurs = data.data.filter(u => u.role === 'livreur').length;
          
          setStats({
            total: data.pagination.total,
            clients,
            livreurs
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des Utilisateurs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Gérer tous les clients enregistrés sur la plateforme
            </p>
            <Button onClick={() => router.push('/back-office/utilisateurs/clients')}>
              Voir les clients
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Livreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Gérer tous les livreurs disponibles pour les livraisons
            </p>
            <Button onClick={() => router.push('/back-office/utilisateurs/livreur')}>
              Voir les livreurs
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Utilisateurs" value={stats.total} />
          <StatCard title="Clients" value={stats.clients} />
          <StatCard title="Livreurs" value={stats.livreurs} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}