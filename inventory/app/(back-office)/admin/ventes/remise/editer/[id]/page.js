// app/(admin)/ventes/remises/editer/[id]/page.js
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, Save } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRemise } from '@/hooks/useRemise'
import { useArticle } from '@/hooks/useArticle'
import { useCategories } from '@/hooks/useCategories'
import { useMarques } from '@/hooks/useMarques'
import { useGenres } from '@/hooks/useGenres'
import { useTailles } from '@/hooks/useTailles'
import { useCouleurs } from '@/hooks/useCouleurs'
import { useUtilisateurs } from '@/hooks/useUtilisateurs'

export default function EditerRemise() {
  const router = useRouter()
  const { id } = useParams()
  const { updateRemise, getActiveRemises } = useRemise()
  const { articles, fetchAllArticles } = useArticle()
  const { categories, fetchCategories } = useCategories()
  const { marques, fetchMarques } = useMarques()
  const { genres, fetchGenres } = useGenres()
  const { tailles, fetchTailles } = useTailles()
  const { couleurs, fetchCouleurs } = useCouleurs()
  const { utilisateurs, fetchUtilisateurs } = useUtilisateurs()
  
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
    tailles: [],
    couleurs: [],
    utilisateurs: []
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        // Load all necessary data
        await Promise.all([
          fetchAllArticles(),
          fetchCategories(),
          fetchMarques(),
          fetchGenres(),
          fetchTailles(),
          fetchCouleurs(),
          fetchUtilisateurs()
        ])

        // Load the specific discount
        const remises = await getActiveRemises()
        const remiseData = remises.find(r => r.id === parseInt(id))
        
        if (!remiseData) {
          throw new Error('Remise non trouvée')
        }

        // Update form data
        setFormData({
          code: remiseData.code,
          libelle: remiseData.libelle,
          description: remiseData.description,
          type_remise: remiseData.type_remise,
          valeur: remiseData.valeur,
          date_debut: new Date(remiseData.date_debut),
          date_fin: new Date(remiseData.date_fin),
          est_active: remiseData.est_active,
          min_articles: remiseData.min_articles,
          min_montant: remiseData.min_montant,
          max_utilisation: remiseData.max_utilisation,
          est_cumulable: remiseData.est_cumulable,
          apply_to: remiseData.apply_to,
          articles: remiseData.discounted_articles?.map(a => a.id) || [],
          categories: remiseData.discounted_categories?.map(c => c.id) || [],
          marques: remiseData.discounted_marques?.map(m => m.id) || [],
          genres: remiseData.discounted_genres?.map(g => g.id) || [],
          tailles: remiseData.discounted_tailles?.map(t => t.id) || [],
          couleurs: remiseData.discounted_couleurs?.map(c => c.id) || [],
          utilisateurs: remiseData.discounted_utilisateurs?.map(u => u.id) || []
        })
      } catch (error) {
        toast.error(error.message)
        router.push('/admin/ventes/remise')
      } finally {
        setInitialLoading(false)
      }
    }

    chargerDonnees()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateRemise(id, {
        ...formData,
        date_debut: formData.date_debut.toISOString(),
        date_fin: formData.date_fin.toISOString()
      })
      toast.success('Remise mise à jour avec succès')
      router.push('/admin/ventes/remise')
    } catch (error) {
      toast.error(error.message || 'Échec de la mise à jour de la remise')
    } finally {
      setLoading(false)
    }
  }

  const renderApplyToFields = () => {
    switch (formData.apply_to) {
      case 'articles':
        return (
          <div className="space-y-2">
            <Label>Articles applicables</Label>
            <Select
              value={formData.articles[0] || ""}
              onValueChange={(value) => handleSelectChange('articles', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un article" />
              </SelectTrigger>
              <SelectContent>
                {articles.map(article => (
                  <SelectItem key={article.id} value={article.id}>
                    {article.nom_produit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'categories':
        return (
          <div className="space-y-2">
            <Label>Catégories applicables</Label>
            <Select
              value={formData.categories[0] || ""}
              onValueChange={(value) => handleSelectChange('categories', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(categorie => (
                  <SelectItem key={categorie.id} value={categorie.id}>
                    {categorie.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'marques':
        return (
          <div className="space-y-2">
            <Label>Marques applicables</Label>
            <Select
              value={formData.marques[0] || ""}
              onValueChange={(value) => handleSelectChange('marques', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une marque" />
              </SelectTrigger>
              <SelectContent>
                {marques.map(marque => (
                  <SelectItem key={marque.id} value={marque.id}>
                    {marque.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'genres':
        return (
          <div className="space-y-2">
            <Label>Genres applicables</Label>
            <Select
              value={formData.genres[0] || ""}
              onValueChange={(value) => handleSelectChange('genres', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map(genre => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'tailles':
        return (
          <div className="space-y-2">
            <Label>Tailles applicables</Label>
            <Select
              value={formData.tailles[0] || ""}
              onValueChange={(value) => handleSelectChange('tailles', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une taille" />
              </SelectTrigger>
              <SelectContent>
                {tailles.map(taille => (
                  <SelectItem key={taille.id} value={taille.id}>
                    {taille.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'couleurs':
        return (
          <div className="space-y-2">
            <Label>Couleurs applicables</Label>
            <Select
              value={formData.couleurs[0] || ""}
              onValueChange={(value) => handleSelectChange('couleurs', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une couleur" />
              </SelectTrigger>
              <SelectContent>
                {couleurs.map(couleur => (
                  <SelectItem key={couleur.id} value={couleur.id}>
                    {couleur.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'utilisateurs':
        return (
          <div className="space-y-2">
            <Label>Utilisateurs applicables</Label>
            <Select
              value={formData.utilisateurs[0] || ""}
              onValueChange={(value) => handleSelectChange('utilisateurs', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {utilisateurs.map(utilisateur => (
                  <SelectItem key={utilisateur.id} value={utilisateur.id}>
                    {utilisateur.nom} {utilisateur.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      default:
        return null
    }
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Chargement en cours...</p>
      </div>
    )
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
            Modifiez les détails de la remise ci-dessous
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
                />
              </div>
              
              <div className="space-y-2">
                <Label>Période de validité *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_debut">Date de début</Label>
                    <Calendar
                      mode="single"
                      selected={formData.date_debut}
                      onSelect={(date) => handleDateChange('date_debut', date)}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_fin">Date de fin</Label>
                    <Calendar
                      mode="single"
                      selected={formData.date_fin}
                      onSelect={(date) => handleDateChange('date_fin', date)}
                      className="rounded-md border"
                    />
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
                    <SelectItem value="categories">Par catégorie</SelectItem>
                    <SelectItem value="marques">Par marque</SelectItem>
                    <SelectItem value="genres">Par genre</SelectItem>
                    <SelectItem value="tailles">Par taille</SelectItem>
                    <SelectItem value="couleurs">Par couleur</SelectItem>
                    <SelectItem value="utilisateurs">Utilisateurs spécifiques</SelectItem>
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
                  value={formData.min_articles}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_montant">Montant minimum du panier (€)</Label>
                <Input
                  id="min_montant"
                  name="min_montant"
                  type="number"
                  value={formData.min_montant}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_utilisation">Utilisations maximum</Label>
                <Input
                  id="max_utilisation"
                  name="max_utilisation"
                  type="number"
                  value={formData.max_utilisation}
                  onChange={handleChange}
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
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}