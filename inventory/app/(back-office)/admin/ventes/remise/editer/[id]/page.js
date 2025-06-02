'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'; // Add useMemo
import { useRouter, useParams } from 'next/navigation';
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
import { ChevronLeft, Save, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRemise } from '@/hooks/useRemise';
import useCatalog from '@/hooks/useCatalog';
import MultiSelectDropdown from '@/app/components/DashboardComponents/Remise/MultiSelectDropdown';

export default function EditerRemise() {
  const router = useRouter();
  const { id } = useParams();
  const { getRemiseById, updateRemise } = useRemise();
  const {
    articles,
    categories,
    marques,
    genres,
    filteredArticles, // Keep this for dynamic filtering after initial load
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
    date_debut: null,
    date_fin: null,
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
  const [isFetchingRemise, setIsFetchingRemise] = useState(true);

  // Load ALL static catalog data once
  useEffect(() => {
    const loadAllCatalogData = async () => {
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
    loadAllCatalogData();
  }, [fetchAllArticles, fetchAllCategories, fetchAllMarques, fetchAllGenres]);

  // Load the specific remise data and pre-fill form
/*   useEffect(() => {
    const loadRemiseData = async () => {
      if (!id) return; // Ensure ID exists before fetching

      setIsFetchingRemise(true);
      try {
        const remiseResponse = await getRemiseById(id);

        if (!remiseResponse || !remiseResponse.data) {
          throw new Error('No remise data received');
        }

        const remise = remiseResponse.data;
        console.log('Fetched remise:', remise);

        const updatedFormData = {
          code: remise.code || '',
          libelle: remise.libelle || '',
          description: remise.description || '',
          type_remise: remise.type_remise || 'pourcentage',
          valeur: remise.valeur ? remise.valeur.toString() : '',
          date_debut: remise.date_debut ? new Date(remise.date_debut) : null,
          date_fin: remise.date_fin ? new Date(remise.date_fin) : null,
          est_active: !!remise.est_active,
          min_articles: remise.min_articles ? remise.min_articles.toString() : '',
          min_montant: remise.min_montant ? remise.min_montant.toString() : '',
          max_utilisation: remise.max_utilisation ? remise.max_utilisation.toString() : '',
          est_cumulable: !!remise.est_cumulable,
          apply_to: remise.apply_to || 'tous',
          // Ensure these are arrays and map correctly
          articles: remise.discounted_articles?.map(a => a.id) || [],
          categories: remise.discounted_categories?.map(c => c.id) || [],
          marques: remise.discounted_marques?.map(m => m.id) || [],
          genres: remise.discounted_genres?.map(g => g.id) || [],
        };

        setFormData(updatedFormData);
        console.log('Updated form data:', updatedFormData);

        // Set showArticleSelection based on apply_to from fetched data
        if (updatedFormData.apply_to === 'articles' || ['marques', 'categories', 'genres'].includes(updatedFormData.apply_to)) {
          setShowArticleSelection(true);
        } else {
          setShowArticleSelection(false);
        }

        // Trigger filtered articles fetch ONLY if apply_to is relevant and there are IDs
        if (updatedFormData.apply_to === 'marques' && updatedFormData.marques.length > 0) {
          await fetchArticlesByMarque(updatedFormData.marques);
        } else if (updatedFormData.apply_to === 'categories' && updatedFormData.categories.length > 0) {
          await fetchArticlesByCategorie(updatedFormData.categories);
        } else if (updatedFormData.apply_to === 'genres' && updatedFormData.genres.length > 0) {
          await fetchArticlesByGenre(updatedFormData.genres);
        }

      } catch (error) {
        console.error('Error loading remise:', error);
        toast.error(error.message || 'Failed to load remise data');
      } finally {
        setIsFetchingRemise(false);
      }
    };

    // Only run this effect if id is available and catalog data (e.g., categories, marques, genres) is loaded
    // This prevents re-fetching remise data prematurely or unnecessarily
    if (id && categories.length > 0 && marques.length > 0 && genres.length > 0) {
        loadRemiseData();
    }
  }, [id, getRemiseById, categories, marques, genres, fetchArticlesByMarque, fetchArticlesByCategorie, fetchArticlesByGenre]);
 */

  useEffect(() => {
    const loadRemiseData = async () => {
      if (!id) return; // Ensure ID exists before fetching

      setIsFetchingRemise(true);
      try {
        const remiseResponse = await getRemiseById(id);

        if (!remiseResponse || !remiseResponse.data) {
          throw new Error('No remise data received');
        }

        const remise = remiseResponse.data;
        console.log('Fetched remise:', remise);

        const updatedFormData = {
          code: remise.code || '',
          libelle: remise.libelle || '',
          description: remise.description || '',
          type_remise: remise.type_remise || 'pourcentage',
          valeur: remise.valeur ? remise.valeur.toString() : '',
          date_debut: remise.date_debut ? new Date(remise.date_debut) : null,
          date_fin: remise.date_fin ? new Date(remise.date_fin) : null,
          est_active: !!remise.est_active,
          min_articles: remise.min_articles ? remise.min_articles.toString() : '',
          min_montant: remise.min_montant ? remise.min_montant.toString() : '',
          max_utilisation: remise.max_utilisation ? remise.max_utilisation.toString() : '',
          est_cumulable: !!remise.est_cumulable,
          apply_to: remise.apply_to || 'tous',
          // Ensure these are arrays and map correctly
          articles: remise.discounted_articles?.map(a => a.id) || [],
          categories: remise.discounted_categories?.map(c => c.id) || [],
          marques: remise.discounted_marques?.map(m => m.id) || [],
          genres: remise.discounted_genres?.map(g => g.id) || [],
        };

        setFormData(updatedFormData);
        console.log('Updated form data:', updatedFormData);

        // Set showArticleSelection based on apply_to from fetched data
        if (updatedFormData.apply_to === 'articles' || ['marques', 'categories', 'genres'].includes(updatedFormData.apply_to)) {
          setShowArticleSelection(true);
        } else {
          setShowArticleSelection(false);
        }

        // Trigger filtered articles fetch ONLY if apply_to is relevant and there are IDs
        if (updatedFormData.apply_to === 'marques' && updatedFormData.marques.length > 0) {
          await fetchArticlesByMarque(updatedFormData.marques);
        } else if (updatedFormData.apply_to === 'categories' && updatedFormData.categories.length > 0) {
          await fetchArticlesByCategorie(updatedFormData.categories);
        } else if (updatedFormData.apply_to === 'genres' && updatedFormData.genres.length > 0) {
          await fetchArticlesByGenre(updatedFormData.genres);
        }

      } catch (error) {
        console.error('Error loading remise:', error);
        toast.error(error.message || 'Failed to load remise data');
      } finally {
        setIsFetchingRemise(false);
      }
    };

    // Only run this effect if id is available and catalog data (e.g., categories, marques, genres) is loaded
    // This prevents re-fetching remise data prematurely or unnecessarily
    if (id && categories.length > 0 && marques.length > 0 && genres.length > 0) {
        loadRemiseData();
    }
  }, [id, getRemiseById, categories, marques, genres, fetchArticlesByMarque, fetchArticlesByCategorie, fetchArticlesByGenre]);
  // Optimized handler for form changes (input, textarea)
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // Optimized handler for select (dropdowns) and switches
  const handleSelectChange = useCallback(async (name, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value,
      };

      // When `apply_to` changes, reset all related selections for articles, categories, marques, genres
      if (name === 'apply_to') {
        newFormData.articles = [];
        newFormData.categories = [];
        newFormData.marques = [];
        newFormData.genres = [];
        // Determine whether to show article selection based on the new apply_to value
        setShowArticleSelection(value === 'articles' || ['marques', 'categories', 'genres'].includes(value));
      }

      return newFormData;
    });
  }, []);

  // Optimized handler for multi-select dropdowns (categories, marques, genres)
  const handleMultiSelectChange = useCallback(async (name, selectedOptions) => {
    const values = selectedOptions.map(option => Number(option.value)).filter(id => !isNaN(id));

    setFormData(prev => ({
      ...prev,
      [name]: values,
      articles: [], // Always reset articles when parent selection changes
    }));

    // Fetch filtered articles immediately after selection changes for categories/marques/genres
    if (values.length > 0) {
      if (name === 'marques') {
        await fetchArticlesByMarque(values);
      } else if (name === 'categories') {
        await fetchArticlesByCategorie(values);
      } else if (name === 'genres') {
        await fetchArticlesByGenre(values);
      }
      setShowArticleSelection(true); // Always show article selection if a parent is selected
    } else {
      setShowArticleSelection(false); // Hide if no parent is selected
    }
  }, [fetchArticlesByMarque, fetchArticlesByCategorie, fetchArticlesByGenre]);

  // Optimized handler for article multi-select dropdown
  const handleArticleSelection = useCallback((selectedOptions) => {
    const values = selectedOptions.map(option => Number(option.value)).filter(id => !isNaN(id));
    setFormData(prev => ({
      ...prev,
      articles: values,
    }));
  }, []);

  // Optimized handler for date changes
  const handleDateChange = useCallback((name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.libelle || !formData.valeur || !formData.date_debut || !formData.date_fin) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.apply_to !== 'tous') {
      const selectedItems = formData[formData.apply_to];
      if (!selectedItems || selectedItems.length === 0) {
        toast.error(`Please select at least one ${formData.apply_to}`);
        return;
      }
      // Special validation for apply_to categories/marques/genres when articles are expected
      if (['marques', 'categories', 'genres'].includes(formData.apply_to) && showArticleSelection && formData.articles.length === 0) {
        toast.error(`Please select articles from the selected ${formData.apply_to}`);
        return;
      }
    } else if (formData.apply_to === 'articles' && formData.articles.length === 0) {
        toast.error('Please select at least one article.');
        return;
    }


    setLoading(true);

    try {
      const remiseData = {
        ...formData,
        date_debut: formData.date_debut ? formData.date_debut.toISOString() : null,
        date_fin: formData.date_fin ? formData.date_fin.toISOString() : null,
        valeur: parseFloat(formData.valeur) || 0,
        min_articles: formData.min_articles ? parseInt(formData.min_articles) : null,
        min_montant: formData.min_montant ? parseFloat(formData.min_montant) : null,
        max_utilisation: formData.max_utilisation ? parseInt(formData.max_utilisation) : null,
        articles: showArticleSelection && formData.apply_to !== 'tous' ? formData.articles : [], // Only send articles if applicable
        categories: formData.apply_to === 'categories' ? formData.categories : [],
        marques: formData.apply_to === 'marques' ? formData.marques : [],
        genres: formData.apply_to === 'genres' ? formData.genres : [],
      };

      await updateRemise(id, remiseData);
      router.push('/admin/ventes/remise');
    } catch (error) {
      toast.error(error.message || 'Failed to update discount');
    } finally {
      setLoading(false);
    }
  };

  // Memoize getSelectedOptions to prevent unnecessary re-creations
  const getSelectedOptions = useCallback((type) => {
    const items = type === 'articles' ? (showArticleSelection ? filteredArticles : articles) :
      type === 'categories' ? categories :
      type === 'marques' ? marques :
      genres;

    return formData[type].map(id => {
      const item = items.find(item => item?.id === id);
      return {
        value: id.toString(),
        label: item ? (type === 'articles' ? `${item.nom_produit} (ID: ${item.id})` : item.libelle) : `ID: ${id}`
      };
    }).filter(option => option.label !== `ID: ${option.value}`); // Filter out options where label is just "ID: id"
  }, [formData, showArticleSelection, filteredArticles, articles, categories, marques, genres]);


  // Memoize the renderApplyToFields function
  const renderApplyToFields = useMemo(() => {
    switch (formData.apply_to) {
      case 'articles':
        return (
          <div className="space-y-4">
            <Label>Select Articles *</Label>
            <MultiSelectDropdown
              options={articles.map(article => ({
                value: article.id.toString(),
                label: `${article.nom_produit} (ID: ${article.id})`
              }))}
              selected={getSelectedOptions('articles')}
              onChange={handleArticleSelection}
              placeholder="Select articles"
            />
          </div>
        );
      case 'categories':
        return (
          <div className="space-y-4">
            <Label>Select Categories *</Label>
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
                <Label>Select Articles from Selected Categories *</Label>
                <MultiSelectDropdown
                  options={filteredArticles.map(article => ({
                    value: article.id.toString(),
                    label: `${article.nom_produit} (ID: ${article.id})`
                  }))}
                  selected={getSelectedOptions('articles')}
                  onChange={handleArticleSelection}
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
                  onChange={handleArticleSelection}
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
            <Label>Select Genders *</Label>
            <MultiSelectDropdown
              options={genres.map(genre => ({
                value: genre.id.toString(),
                label: genre.libelle
              }))}
              selected={getSelectedOptions('genres')}
              onChange={(selected) => handleMultiSelectChange('genres', selected)}
              placeholder="Select genders"
            />
            {showArticleSelection && (
              <>
                <Label>Select Articles from Selected Genders *</Label>
                <MultiSelectDropdown
                  options={filteredArticles.map(article => ({
                    value: article.id.toString(),
                    label: `${article.nom_produit} (ID: ${article.id})`
                  }))}
                  selected={getSelectedOptions('articles')}
                  onChange={handleArticleSelection}
                  placeholder="Select articles"
                  loading={filterLoading}
                />
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [formData.apply_to, showArticleSelection, filterLoading, articles, categories, marques, genres, filteredArticles, getSelectedOptions, handleArticleSelection, handleMultiSelectChange]);


  if (isFetchingRemise || (filterLoading && showArticleSelection)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading discount details...</span>
      </div>
    );
  }

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
          <CardTitle>Modifier la remise</CardTitle>
          <CardDescription>
            Modifiez les détails de la remise ci-dessous (* champs obligatoires)
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
                          fromDate={formData.date_debut || new Date()}
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

              {renderApplyToFields} {/* Use the memoized value */}

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
                <Label htmlFor="min_montant">Montant minimum du panier (DT)</Label>
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
            <Button type="submit" disabled={loading || isFetchingRemise}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Mise à jour...' : 'Mettre à jour la remise'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}