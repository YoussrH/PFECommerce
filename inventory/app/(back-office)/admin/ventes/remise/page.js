'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, BellIcon } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const remiseSchema = z.object({
  libelle: z.string().min(1),
  type: z.enum(['pourcentage', 'fixe', 'bogo']),
  valeur: z.number().min(1),
  date_debut: z.string(),
  date_fin: z.string(),
  evenement_id: z.string().optional(),
});

const PageRemises = () => {
  const [remises, setRemises] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tailles, setTailles] = useState([]);
  const [enAttenteCount, setEnAttenteCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTailles, setSelectedTailles] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(remiseSchema),
  });

  useEffect(() => {
    axios.get('/api/remises').then(res => setRemises(res.data));
    axios.get('/api/evenements').then(res => setEvenements(res.data));
    axios.get('/api/articles').then(res => setArticles(res.data));
    axios.get('/api/categories').then(res => setCategories(res.data));
    axios.get('/api/tailles').then(res => setTailles(res.data));
  }, []);

  useEffect(() => {
    setEnAttenteCount(remises.filter(r => r.etat === 'en_attente').length);
  }, [remises]);

  const onSubmit = async (data) => {
    try {
      const res = await axios.post('/api/remises', data);
      const remiseId = res.data.id;

      // Associations après création
      if (selectedArticles.length > 0) await axios.put(`/api/remises/${remiseId}/articles`, { articleIds: selectedArticles });
      if (selectedCategories.length > 0) await axios.put(`/api/remises/${remiseId}/categories`, { categorieIds: selectedCategories });
      if (selectedTailles.length > 0) await axios.put(`/api/remises/${remiseId}/tailles`, { tailleIds: selectedTailles });

      setRemises(prev => [...prev, res.data]);
      reset();
      setSelectedArticles([]);
      setSelectedCategories([]);
      setSelectedTailles([]);
      setDialogOpen(false);
    } catch (err) {
      console.error('Erreur création:', err);
    }
  };

  const handleMultiSelect = (e, setter) => {
    const options = Array.from(e.target.selectedOptions).map(o => o.value);
    setter(options);
  };

  const colonnes = [
    {
      accessorKey: 'libelle',
      header: 'Libellé',
      cell: ({ row }) => <span>{row.original.libelle}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: 'valeur',
      header: 'Valeur',
      cell: ({ row }) => <span>{row.original.valeur}{row.original.type === 'pourcentage' ? '%' : ' TND'}</span>,
    },
    {
      accessorKey: 'etat',
      header: 'État',
      cell: ({ row }) => <Badge>{row.original.etat}</Badge>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des remises</h1>
        <div className="flex space-x-4">
          <Button variant="outline">
            <BellIcon className="mr-2 h-4 w-4" /> En attente
            {enAttenteCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs">
                {enAttenteCount}
              </span>
            )}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" /> Nouvelle remise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle remise</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Libellé</Label>
                  <Input {...register('libelle')} />
                  {errors.libelle && <p className="text-red-500 text-sm">{errors.libelle.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select {...register('type')}>
                      <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pourcentage">Pourcentage</SelectItem>
                        <SelectItem value="fixe">Montant fixe</SelectItem>
                        <SelectItem value="bogo">BOGO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <Input type="number" {...register('valeur', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début</Label>
                    <Input type="date" {...register('date_debut')} />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input type="date" {...register('date_fin')} />
                  </div>
                </div>

                <div>
                  <Label>Événement lié</Label>
                  <select {...register('evenement_id')} className="w-full border p-2 rounded">
                    <option value="">Aucun</option>
                    {evenements.map(e => (
                      <option key={e.id} value={e.id}>{e.nom} ({e.date_debut})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Catégories</Label>
                  <select multiple onChange={(e) => handleMultiSelect(e, setSelectedCategories)} className="w-full border p-2 rounded h-24">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>

                <div>
                  <Label>Articles</Label>
                  <select multiple onChange={(e) => handleMultiSelect(e, setSelectedArticles)} className="w-full border p-2 rounded h-24">
                    {articles.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                </div>

                <div>
                  <Label>Tailles</Label>
                  <select multiple onChange={(e) => handleMultiSelect(e, setSelectedTailles)} className="w-full border p-2 rounded h-24">
                    {tailles.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>

                <Button type="submit" className="mt-4">Créer la remise</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="toutes">
        <TabsList>
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
          <TabsTrigger value="en_attente">En attente ({enAttenteCount})</TabsTrigger>
          <TabsTrigger value="evenements">Par événement</TabsTrigger>
        </TabsList>

        <TabsContent value="toutes">
          <Card>
            <CardHeader><CardTitle>Toutes les remises</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={colonnes} data={remises} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="en_attente">
          <Card>
            <CardHeader><CardTitle>Remises en attente</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={colonnes} data={remises.filter(r => r.etat === 'en_attente')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evenements">
          {evenements.map(e => (
            <Card key={e.id} className="mb-4">
              <CardHeader><CardTitle>{e.nom} ({e.date_debut})</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc ml-4">
                  {remises.filter(r => r.evenement_id === e.id).map(r => (
                    <li key={r.id}>{r.libelle} - {r.valeur}{r.type === 'pourcentage' ? '%' : 'TND'}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageRemises;