// app/(back-office)/admin/ventes/remise/nouveau/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Save, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemise } from '@/hooks/useRemise';
import useCatalog from '@/hooks/useCatalog';
import MultiSelectDropdown from '@/app/components/DashboardComponents/Remise/MultiSelectDropdown';

export default function NouvelleRemise() {
  const router = useRouter();
  const { createRemise } = useRemise();
  const { 
    articles, 
    categories, 
    marques, 
    genres,
    filteredArticles,
    filterLoading,
    fetchArticlesByMarque,
    fetchArticlesByCategorie,
    fetchArticlesByGenre,
    fetchAllArticles, 
    fetchAllCategories, 
    fetchAllMarques, 
    fetchAllGenres 
  } = useCatalog();

  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    description: '',
    type_remise: 'pourcentage',
    valeur: '',
    date_debut: new Date(),
    date_fin: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    est_active: true,
    min_articles: '',
    min_montant: '',
    max_utilisation: '',
    est_cumulable: false,
    apply_to: 'tous',
    articles: [],
    categories: [],
    marques: [],
    genres: [],
  });

  const [loading, setLoading] = useState(false);
  const [showArticleSelection, setShowArticleSelection] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAllArticles(),
          fetchAllCategories(),
          fetchAllMarques(),
          fetchAllGenres()
        ]);
      } catch (error) {
        toast.error('Failed to load catalog data');
      }
    };

    loadData();
  }, [fetchAllArticles, fetchAllCategories, fetchAllMarques, fetchAllGenres]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      articles: [], // Reset articles when changing apply_to
    }));
    
    setShowArticleSelection(false);
  };

  const handleMultiSelectChange = async (name, selectedOptions) => {
    const values = selectedOptions.map(option => Number(option.value)).filter(id => !isNaN(id));
    
    setFormData(prev => ({
      ...prev,
      [name]: values,
      articles: [], // Reset articles when changing selection
    }));

    // Only fetch articles if we're not showing article selection yet
    if (name === 'marques' && values.length > 0) {
      await fetchArticlesByMarque(values);
      setShowArticleSelection(true);
    } else if (name === 'categories' && values.length > 0) {
      await fetchArticlesByCategorie(values);
      setShowArticleSelection(true);
    } else if (name === 'genres' && values.length > 0) {
      await fetchArticlesByGenre(values);
      setShowArticleSelection(true);
    } else {
      setShowArticleSelection(false);
    }
  };

  const handleArticleSelection = (selectedOptions) => {
    const values = selectedOptions.map(option => Number(option.value)).filter(id => !isNaN(id));
    setFormData(prev => ({
      ...prev,
      articles: values,
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.code || !formData.libelle || !formData.valeur) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate selection based on apply_to
    if (formData.apply_to !== 'tous') {
      const selectedItems = formData[formData.apply_to];
      if (!selectedItems || selectedItems.length === 0) {
        toast.error(`Please select at least one ${formData.apply_to}`);
        return;
      }

      // For marques/categories/genres, ensure we have either filtered articles or specific selections
      if (['marques', 'categories', 'genres'].includes(formData.apply_to)) {
        if (formData.articles.length === 0 && !showArticleSelection) {
          toast.error(`Please select articles for the selected ${formData.apply_to}`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Prepare the data to send to backend
      const remiseData = {
        ...formData,
        date_debut: formData.date_debut.toISOString(),
        date_fin: formData.date_fin.toISOString(),
        valeur: parseFloat(formData.valeur),
        min_articles: formData.min_articles ? parseInt(formData.min_articles) : null,
        min_montant: formData.min_montant ? parseFloat(formData.min_montant) : null,
        max_utilisation: formData.max_utilisation ? parseInt(formData.max_utilisation) : null,
        // Only send articles if we have specific selections
        articles: showArticleSelection ? formData.articles : [],
      };

      console.log('Sending remise data:', remiseData); // Debug log

      await createRemise(remiseData);
      router.push('/admin/ventes/remise');
    } catch (error) {
      toast.error(error.message || 'error de creation de remise  ');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedOptions = (type) => {
    const items = type === 'articles' ? (showArticleSelection ? filteredArticles : articles) : 
                 type === 'categories' ? categories :
                 type === 'marques' ? marques :
                 genres;
    
    return formData[type].map(id => {
      const item = items.find(item => item.id === id);
      return {
        value: id.toString(),
        label: item ? (type === 'articles' ? `${item.nom_produit} (ID: ${item.id})` : item.libelle) : `ID: ${id}`
      };
    });
  };

  const renderApplyToFields = () => {
    switch (formData.apply_to) {
      case 'articles':
        return (
          <div className="space-y-4">
            <Label>Selectioner Articles *</Label>
            <MultiSelectDropdown
              options={articles.map(article => ({
                value: article.id.toString(),
                label: `${article.nom_produit} (ID: ${article.id})`
              }))}
              selected={getSelectedOptions('articles')}
              onChange={(selected) => handleArticleSelection(selected)}
              placeholder="Select articles"
            />
          </div>
        );
      case 'categories':
        return (
          <div className="space-y-4">
            <Label>Selectioner Categories *</Label>
            <MultiSelectDropdown
              options={categories.map(categorie => ({
                value: categorie.id.toString(),
                label: categorie.libelle
              }))}
              selected={getSelectedOptions('categories')}
              onChange={(selected) => handleMultiSelectChange('categories', selected)}
              placeholder="Select categories"
            />
            {showArticleSelection && (
              <>
                <Label>Select Articles depuis  Categories Selectionée *</Label>
                <MultiSelectDropdown
                  options={filteredArticles.map(article => ({
                    value: article.id.toString(),
                    label: `${article.nom_produit} (ID: ${article.id})`
                  }))}
                  selected={getSelectedOptions('articles')}
                  onChange={(selected) => handleArticleSelection(selected)}
                  placeholder="Select articles"
                  loading={filterLoading}
                />
              </>
            )}
          </div>
        );
          case 'marques':
                  return (
                    <div className="space-y-4">
                      <Label>Select Brands *</Label>
                      <MultiSelectDropdown
                        options={marques.map(marque => ({
                          value: marque.id.toString(),
                          label: marque.libelle
                        }))}
                        selected={getSelectedOptions('marques')}
                        onChange={(selected) => handleMultiSelectChange('marques', selected)}
                        placeholder="Select brands"
                      />
                      {showArticleSelection && (
                        <>
                          <Label>Select Articles from Selected Brands *</Label>
                          <MultiSelectDropdown
                            options={filteredArticles.map(article => ({
                              value: article.id.toString(),
                              label: `${article.nom_produit} (ID: ${article.id})`
                            }))}
                            selected={getSelectedOptions('articles')}
                            onChange={(selected) => handleArticleSelection(selected)}
                            placeholder="Select articles"
                            loading={filterLoading}
                          />
                        </>
                      )}
                    </div>
                  );
          case 'genres':
            return (
              <div className="space-y-4">
                <Label>Selectioner Genres *</Label>
                <MultiSelectDropdown
                  options={genres.map(genre => ({
                    value: genre.id.toString(),
                    label: `${genre.libelle} (ID: ${genre.id})`
                  }))}
                  selected={getSelectedOptions('genres')}
                  onChange={(selected) => handleMultiSelectChange('genres', selected)}
                  placeholder="Select genres"
                />
                {showArticleSelection && (
                  <>
                    <Label>Articles des Genres Selectionés *</Label>
                    {filterLoading ? (
                      <div>Loading articles...</div>
                    ) : filteredArticles.length > 0 ? (
                      <MultiSelectDropdown
                        options={filteredArticles.map(article => ({
                          value: article.id.toString(),
                          label: `${article.nom_produit} (ID: ${article.id})`
                        }))}
                        selected={getSelectedOptions('articles')}
                        onChange={(selected) => handleArticleSelection(selected)}
                        placeholder="Select articles"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">
                        No articles found for selected genres
                      </div>
                    )}
                  </>
                )}
              </div>
            );
              
                  default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Créer une nouvelle remise</CardTitle>
          <CardDescription>
            Remplissez les détails de la remise ci-dessous (* champs obligatoires)
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Code de la remise *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="EXEMPLE20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="libelle">Libellé *</Label>
                <Input
                  id="libelle"
                  name="libelle"
                  value={formData.libelle}
                  onChange={handleChange}
                  required
                  placeholder="Remise de 20%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de la remise..."
                />
              </div>

              <div className="space-y-2">
                <Label>Type de remise *</Label>
                <Select
                  value={formData.type_remise}
                  onValueChange={(value) => handleSelectChange('type_remise', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pourcentage">Pourcentage</SelectItem>
                    <SelectItem value="montant_fixe">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valeur">Valeur *</Label>
                <Input
                  id="valeur"
                  name="valeur"
                  type="number"
                  value={formData.valeur}
                  onChange={handleChange}
                  required
                  min="0"
                  step={formData.type_remise === 'pourcentage' ? '1' : '0.01'}
                  placeholder={formData.type_remise === 'pourcentage' ? '20' : '50'}
                />
              </div>

              <div className="space-y-2">
                <Label>Période de validité *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_debut">Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date_debut ? (
                            format(formData.date_debut, 'PPP', { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date_debut}
                          onSelect={(date) => handleDateChange('date_debut', date)}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_fin">Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date_fin ? (
                            format(formData.date_fin, 'PPP', { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date_fin}
                          onSelect={(date) => handleDateChange('date_fin', date)}
                          initialFocus
                          locale={fr}
                          fromDate={formData.date_debut}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="est_active"
                    checked={formData.est_active}
                    onCheckedChange={(checked) => handleSelectChange('est_active', checked)}
                  />
                  <Label htmlFor="est_active">
                    {formData.est_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application de la remise *</Label>
                <Select
                  value={formData.apply_to}
                  onValueChange={(value) => handleSelectChange('apply_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les produits</SelectItem>
                    <SelectItem value="articles">Articles spécifiques</SelectItem>
                    <SelectItem value="categories">Catégories</SelectItem>
                    <SelectItem value="marques">Marques</SelectItem>
                    <SelectItem value="genres">Genres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderApplyToFields()}

              <div className="space-y-2">
                <Label htmlFor="min_articles">Nombre minimum d&apos;articles</Label>
                <Input
                  id="min_articles"
                  name="min_articles"
                  type="number"
                  min="0"
                  value={formData.min_articles}
                  onChange={handleChange}
                  placeholder="Laisser vide pour aucun minimum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_montant">Montant minimum du panier (€)</Label>
                <Input
                  id="min_montant"
                  name="min_montant"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_montant}
                  onChange={handleChange}
                  placeholder="Laisser vide pour aucun minimum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_utilisation">Utilisations maximum</Label>
                <Input
                  id="max_utilisation"
                  name="max_utilisation"
                  type="number"
                  min="0"
                  value={formData.max_utilisation}
                  onChange={handleChange}
                  placeholder="Laisser vide pour illimité"
                />
              </div>

              <div className="space-y-2">
                <Label>Cumulable avec d&apos;autres remises</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="est_cumulable"
                    checked={formData.est_cumulable}
                    onCheckedChange={(checked) => handleSelectChange('est_cumulable', checked)}
                  />
                  <Label htmlFor="est_cumulable">
                    {formData.est_cumulable ? 'Oui' : 'Non'}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer la remise'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}