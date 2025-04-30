"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuth } from '@/app/contexts/AuthContext';

const ClientsPage = () => {
  const { user, token, isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });

  const fetchClients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page,
          search,
        },
      };

      const response = await axios.get(
        'http://localhost:5000/utilisateurs/obtenirTousClients',
        config
      );

      if (response.data.success) {
        setClients(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients :', error);
      toast.error('Échec de la récupération des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin, token]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchClients(newPage, searchTerm);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Accès non autorisé. Privilèges administrateur requis.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des clients</h1>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Rechercher des clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit">Rechercher</Button>
        </form>
      </div>

      {loading ? (
        <p>Chargement des clients...</p>
      ) : clients.length === 0 ? (
        <p>Aucun client trouvé</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Points de fidélité</TableHead>
                  <TableHead>Newsletter</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.utilisateur_id}>
                   
                    <TableCell>
                      {client.utilisateur.prenom} {client.utilisateur.nom}
                    </TableCell>
                    <TableCell>{client.utilisateur.email}</TableCell>
                    <TableCell>{client.telephone}</TableCell>
                    <TableCell>{client.points_fidelite}</TableCell>
                    <TableCell>
                      {client.newsletter ? 'Abonné' : 'Non abonné'}
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientsPage;
