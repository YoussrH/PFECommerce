"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ActionHistory() {
  const { user, isAdmin, token } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    adminId: '',
    search: '',
    actionType: 'all' // Default to 'all'
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filters.actionType !== 'all' && { actionType: filters.actionType }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`http://localhost:5000/admin/history?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (response.data.success) {
        setHistory(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && user?.role === 'super_admin') {
      fetchHistory();
    }
  }, [page, filters, isAdmin, token]);

  const handleActionTypeFilter = (value) => {
    setFilters({...filters, actionType: value});
    setPage(1); // Reset to first page when changing filters
  };

  if (!isAdmin || user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">Les privilèges de super administrateur sont nécessaires pour consulter l&apos;historique</p>
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
              <CardTitle>Historique des actions</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherche d'actions..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <Select 
              value={filters.actionType} 
              onValueChange={handleActionTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes actions</SelectItem>
                <SelectItem value="create_admin">Création d&apos;un administrateur</SelectItem>
                <SelectItem value="create_super_admin">Création d&apos;un super administrateur</SelectItem>
                <SelectItem value="delete_admin">Suppression d&apos;un administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Administrateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Email Admin</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {history.map((record) => (
                <TableRow key={record.id}>
                    <TableCell>{record.admin ? `${record.admin.prenom} ${record.admin.nom}` : 'Système'}</TableCell>
                    <TableCell>
                    <span className="capitalize">
                        {record.action_type.replace(/_/g, ' ')}
                    </span>
                    </TableCell>
                    <TableCell>{record.target ? `${record.target.prenom} ${record.target.nom}` : 'N/A'}</TableCell>
                    <TableCell>
                    {record.details && typeof record.details === 'string' 
                        ? JSON.parse(record.details).email || 'N/A'
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                    <TableCell>{record.admin?.email || 'N/A'}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button 
                  variant="outline" 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}