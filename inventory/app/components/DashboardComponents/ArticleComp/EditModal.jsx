"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ImageIcon, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useArticle } from "@/hooks/useArticle"
import useCatalog from "@/hooks/useCatalog"
import axios from "axios"

export default function EditModal({ article, isOpen, onClose, onUpdate }) {
  const { updateArticle } = useArticle()
  const { categories, marques, genres } = useCatalog()
  
  const [editedArticle, setEditedArticle] = useState({
    nom_produit: "",
    description: "",
    conseils: "",
    prix: 0,
    prix_final: 0,
    sku: "",
    stock: 0,
    seo_titre: "",
    mots_cles_seo: "",
    genre: { id: "", libelle: "" },
    categorie: { id: "", libelle: "" },
    marque: { id: "", libelle: "" },
    couleurs: [],
    tailles_par_couleur: {},
    images_couleurs: [],
    variations: []
  })
  
  const [nouvelleCouleurNom, setNouvelleCouleurNom] = useState("")
  const [nouvelleCouleurCode, setNouvelleCouleurCode] = useState("#000000")
  const [selectedTaille, setSelectedTaille] = useState("")
  const [nouvelleTailleQuantite, setNouvelleTailleQuantite] = useState(0)
  const [selectedColorId, setSelectedColorId] = useState(null)
  const [nouvellesImages, setNouvellesImages] = useState([])
  const [imagesSupprimees, setImagesSupprimees] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [availableSizes, setAvailableSizes] = useState([])

  // Fetch available sizes based on category and genre
  useEffect(() => {
    const fetchAvailableSizes = async () => {
      if (editedArticle.categorie?.id && editedArticle.genre?.id) {
        try {
          const response = await axios.get(
            `${API_URL}/tailles/par-categorie-genre?categorie_id=${editedArticle.categorie.id}&genre_id=${editedArticle.genre.id}`
          )
          setAvailableSizes(response.data)
        } catch (error) {
          console.error("Error fetching sizes:", error)
        }
      }
    }
    
    fetchAvailableSizes()
  }, [editedArticle.categorie, editedArticle.genre])

  useEffect(() => {
    if (article) {
      // Format the article data to include all necessary fields with defaults
      const formattedArticle = {
        id: article.id,
        nom_produit: article.nom_produit || "",
        description: article.description || "",
        conseils: article.conseils || "",
        prix: article.prix || 0,
        prix_final: article.prix_final || article.prix || 0,
        sku: article.sku || "",
        stock: article.stock || 0,
        seo_titre: article.seo_titre || "",
        mots_cles_seo: article.mots_cles_seo || "",
        genre: article.genre || { id: "", libelle: "" },
        categorie: article.categorie || { id: "", libelle: "" },
        marque: article.marque || { id: "", libelle: "" },
        couleurs: article.couleurs || [],
        tailles_par_couleur: article.tailles_par_couleur || {},
        images_couleurs: article.images_couleurs || [],
        variations: article.variations || []
      }
      
      setEditedArticle(formattedArticle)
      
      // Combine existing and new images for preview
      const existingImageUrls = article.images_couleurs?.map(img => img.image_url) || []
      setPreviewImages([...existingImageUrls])
      setNouvellesImages([])
      setImagesSupprimees([])
      
      // Set the first color as selected if available
      if (article.couleurs?.length > 0) {
        setSelectedColorId(article.couleurs[0].id)
      }
    }
  }, [article])

  const calculerStockTotal = () => {
    let total = 0
    Object.values(editedArticle.tailles_par_couleur).forEach(colorData => {
      colorData.tailles.forEach(size => {
        total += size.quantite || 0
      })
    })
    return total
  }

  const handleChange = (field, value) => {
    setEditedArticle(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSelectChange = (field, value, options) => {
    const selectedOption = options.find(opt => opt.id === value)
    setEditedArticle(prev => ({
      ...prev,
      [field]: selectedOption || { id: value, libelle: "" }
    }))
  }

  const ajouterCouleur = () => {
    if (nouvelleCouleurNom && nouvelleCouleurCode) {
      const newColorId = Math.max(0, ...editedArticle.couleurs.map(c => c.id)) + 1
      const nouvelleCouleur = {
        id: newColorId,
        libelle: nouvelleCouleurNom,
        hexcode: nouvelleCouleurCode,
      }

      const updatedColors = [...editedArticle.couleurs, nouvelleCouleur]
      const updatedSizes = {
        ...editedArticle.tailles_par_couleur,
        [newColorId]: {
          couleur: nouvelleCouleur,
          tailles: []
        }
      }

      setEditedArticle(prev => ({
        ...prev,
        couleurs: updatedColors,
        tailles_par_couleur: updatedSizes,
        stock: calculerStockTotal()
      }))

      setNouvelleCouleurNom("")
      setNouvelleCouleurCode("#000000")
      setSelectedColorId(newColorId)
    }
  }

  const supprimerCouleur = (colorId) => {
    const updatedColors = editedArticle.couleurs.filter(c => c.id !== colorId)
    const updatedSizes = {...editedArticle.tailles_par_couleur}
    delete updatedSizes[colorId]

    setEditedArticle(prev => ({
      ...prev,
      couleurs: updatedColors,
      tailles_par_couleur: updatedSizes,
      stock: calculerStockTotal()
    }))

    // Update selected color if needed
    if (selectedColorId === colorId) {
      setSelectedColorId(updatedColors[0]?.id || null)
    }
  }

  const ajouterTaille = () => {
    if (selectedTaille && nouvelleTailleQuantite > 0 && selectedColorId) {
      const newSizeId = Math.max(0, ...Object.values(editedArticle.tailles_par_couleur)
        .flatMap(colorData => colorData.tailles.map(size => size.id))) + 1

      const updatedSizes = {...editedArticle.tailles_par_couleur}
      const existingSizes = updatedSizes[selectedColorId].tailles || []
      
      const existingSizeIndex = existingSizes.findIndex(size => size.libelle === selectedTaille)

      if (existingSizeIndex >= 0) {
        existingSizes[existingSizeIndex].quantite = nouvelleTailleQuantite
      } else {
        existingSizes.push({
          id: newSizeId,
          libelle: selectedTaille,
          quantite: nouvelleTailleQuantite
        })
      }

      updatedSizes[selectedColorId].tailles = existingSizes

      setEditedArticle(prev => ({
        ...prev,
        tailles_par_couleur: updatedSizes,
        stock: calculerStockTotal()
      }))

      setSelectedTaille("")
      setNouvelleTailleQuantite(0)
    }
  }

  const supprimerTaille = (colorId, sizeId) => {
    const updatedSizes = {...editedArticle.tailles_par_couleur}
    if (updatedSizes[colorId]) {
      updatedSizes[colorId].tailles = updatedSizes[colorId].tailles.filter(size => size.id !== sizeId)
    }

    setEditedArticle(prev => ({
      ...prev,
      tailles_par_couleur: updatedSizes,
      stock: calculerStockTotal()
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setNouvellesImages(prev => [...prev, ...files])
    setPreviewImages(prev => [...prev, ...newPreviewUrls])
  }

  const supprimerImage = (index) => {
    const imageToRemove = previewImages[index]
    
    // Check if it's an existing image (has an ID) or a new one
    const existingImageIndex = editedArticle.images_couleurs.findIndex(img => img.image_url === imageToRemove)
    
    if (existingImageIndex >= 0) {
      setImagesSupprimees(prev => [...prev, editedArticle.images_couleurs[existingImageIndex].id])
    } else {
      // For new images, find the corresponding file in nouvellesImages
      const newImageIndex = nouvellesImages.findIndex((_, i) => 
        previewImages[index] === URL.createObjectURL(nouvellesImages[i])
      )
      if (newImageIndex >= 0) {
        setNouvellesImages(prev => prev.filter((_, i) => i !== newImageIndex))
      }
    }

    const updatedPreviews = [...previewImages]
    updatedPreviews.splice(index, 1)
    setPreviewImages(updatedPreviews)
  }

  const handleSubmit = async () => {
    try {
      // Prepare form data
      const formData = new FormData()
      
      // Append basic fields
      formData.append('id', editedArticle.id)
      formData.append('nom_produit', editedArticle.nom_produit)
      formData.append('description', editedArticle.description)
      formData.append('conseils', editedArticle.conseils || '')
      formData.append('prix', editedArticle.prix)
      formData.append('prix_final', editedArticle.prix_final || editedArticle.prix)
      formData.append('sku', editedArticle.sku)
      formData.append('stock', calculerStockTotal())
      formData.append('seo_titre', editedArticle.seo_titre || '')
      formData.append('mots_cles_seo', editedArticle.mots_cles_seo || '')
      formData.append('genre_id', editedArticle.genre?.id || '')
      formData.append('categorie_id', editedArticle.categorie?.id || '')
      formData.append('marque_id', editedArticle.marque?.id || '')
      
      // Append colors and sizes
      formData.append('couleurs', JSON.stringify(editedArticle.couleurs))
      formData.append('tailles_par_couleur', JSON.stringify(editedArticle.tailles_par_couleur))
      formData.append('variations', JSON.stringify(editedArticle.variations || []))
      
      // Append deleted images
      formData.append('images_supprimees', JSON.stringify(imagesSupprimees))
      
      // Append new images
      nouvellesImages.forEach(file => {
        formData.append('images', file)
      })

      // Call update function
      const result = await updateArticle(article.id, formData)

      if (result) {
        onUpdate(result)
        onClose()
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="colors">Couleurs</TabsTrigger>
            <TabsTrigger value="sizes">Tailles et stock</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom_produit">Nom du produit</Label>
                <Input
                  id="nom_produit"
                  value={editedArticle.nom_produit || ""}
                  onChange={(e) => handleChange("nom_produit", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={editedArticle.sku || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix">Prix (DT)</Label>
                <Input
                  id="prix"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedArticle.prix || ""}
                  onChange={(e) => handleChange("prix", Number.parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prix_final">Prix final (DT)</Label>
                <Input
                  id="prix_final"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedArticle.prix_final || editedArticle.prix || ""}
                  onChange={(e) => handleChange("prix_final", Number.parseFloat(e.target.value))}
                />
              </div>

                          <div className="space-y-2">
              <Label htmlFor="marque">Marque</Label>
              <Select
                value={editedArticle.marque?.id?.toString() || ""}
                onValueChange={(value) => handleSelectChange("marque", value, marques)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une marque">
                    {editedArticle.marque?.libelle || "Sélectionner une marque"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marques.map((marque) => (
                    <SelectItem key={marque.id} value={marque.id.toString()}>
                      {marque.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={editedArticle.genre?.id?.toString() || ""}
                onValueChange={(value) => handleSelectChange("genre", value, genres)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un genre">
                    {editedArticle.genre?.libelle || "Sélectionner un genre"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <Select
                value={editedArticle.categorie?.id?.toString() || ""}
                onValueChange={(value) => handleSelectChange("categorie", value, categories)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie">
                    {editedArticle.categorie?.libelle || "Sélectionner une catégorie"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((categorie) => (
                    <SelectItem key={categorie.id} value={categorie.id.toString()}>
                      {categorie.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

     

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedArticle.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="conseils">Conseils d'entretien</Label>
                <Textarea
                  id="conseils"
                  value={editedArticle.conseils || ""}
                  onChange={(e) => handleChange("conseils", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock total</Label>
                <Input id="stock" type="number" value={calculerStockTotal()} disabled />
                <p className="text-xs text-muted-foreground">
                  Le stock total est calculé automatiquement à partir des quantités par taille et couleur
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Couleurs disponibles</CardTitle>
                <CardDescription>Gérez les couleurs disponibles pour cet article</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {editedArticle.couleurs.map((couleur) => {
                    const colorSizes = editedArticle.tailles_par_couleur[couleur.id]?.tailles || []
                    const totalQty = colorSizes.reduce((sum, size) => sum + (size.quantite || 0), 0)
                    
                    return (
                      <div key={couleur.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border shadow-sm"
                            style={{ backgroundColor: couleur.hexcode || "#ccc" }}
                          />
                          <span>{couleur.libelle || "Sans nom"}</span>
                          <span className="text-sm text-muted-foreground">
                            ({totalQty} unités)
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => supprimerCouleur(couleur.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="colorName">Nom de la couleur</Label>
                    <Input
                      id="colorName"
                      value={nouvelleCouleurNom}
                      onChange={(e) => setNouvelleCouleurNom(e.target.value)}
                      placeholder="Ex: Rouge, Bleu, Noir..."
                    />
                  </div>
                  <div className="space-y-2 w-full md:w-48">
                    <Label htmlFor="colorCode">Code couleur</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <Input
                          id="colorCode"
                          type="color"
                          value={nouvelleCouleurCode}
                          onChange={(e) => setNouvelleCouleurCode(e.target.value)}
                          className="w-10 h-10 p-1 rounded-md cursor-pointer"
                        />
                        <div
                          className="absolute inset-0 pointer-events-none border rounded-md"
                          style={{ backgroundColor: nouvelleCouleurCode }}
                        ></div>
                      </div>
                      <Input
                        value={nouvelleCouleurCode}
                        onChange={(e) => setNouvelleCouleurCode(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={ajouterCouleur}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sizes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tailles et stock par couleur</CardTitle>
                <CardDescription>Gérez les tailles disponibles et leur quantité pour chaque couleur</CardDescription>
              </CardHeader>
              <CardContent>
                {editedArticle.couleurs.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="selectedColor">Sélectionner une couleur</Label>
                      <Select
                        value={selectedColorId?.toString() || ""}
                        onValueChange={(value) => setSelectedColorId(Number(value))}
                      >
                        <SelectTrigger id="selectedColor">
                          <SelectValue placeholder="Sélectionner une couleur" />
                        </SelectTrigger>
                        <SelectContent>
                          {editedArticle.couleurs.map((couleur) => (
                            <SelectItem key={couleur.id} value={couleur.id.toString()}>
                              {couleur.libelle || "Sans nom"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedColorId && editedArticle.tailles_par_couleur[selectedColorId] && (
                      <>
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2 flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ 
                                backgroundColor: editedArticle.tailles_par_couleur[selectedColorId].couleur?.hexcode || "#ccc" 
                              }}
                            />
                            Tailles pour {editedArticle.tailles_par_couleur[selectedColorId].couleur?.libelle || "Sans nom"}
                          </h3>

                          {editedArticle.tailles_par_couleur[selectedColorId].tailles?.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Taille</TableHead>
                                  <TableHead>Quantité</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {editedArticle.tailles_par_couleur[selectedColorId].tailles.map((taille) => (
                                  <TableRow key={taille.id}>
                                    <TableCell>{taille.libelle || "Sans nom"}</TableCell>
                                    <TableCell>{taille.quantite || 0}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => supprimerTaille(selectedColorId, taille.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              Aucune taille ajoutée pour cette couleur
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="sizeName">Taille</Label>
                            <Select
                              value={selectedTaille}
                              onValueChange={setSelectedTaille}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une taille" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSizes.map((size) => (
                                  <SelectItem key={size.id} value={size.libelle}>
                                    {size.libelle}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label htmlFor="sizeQuantity">Quantité</Label>
                            <Input
                              id="sizeQuantity"
                              type="number"
                              min="0"
                              value={nouvelleTailleQuantite}
                              onChange={(e) => setNouvelleTailleQuantite(Number.parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button onClick={ajouterTaille}>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <div className="p-4">
                      <div className="rounded-full w-12 h-12 bg-muted flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">Aucune couleur n'a été ajoutée à cet article</p>
                      <Button variant="outline" onClick={() => document.getElementById("colors-tab")?.click()}>
                        Ajouter des couleurs d'abord
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Images du produit</CardTitle>
              <CardDescription>
                Images existantes et nouvelles images pour cet article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative group border rounded-lg p-1 hover:shadow-md transition-shadow">
                    <div className="aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={image}
                        alt={`Image produit ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-6 w-6"
                      onClick={() => supprimerImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {!nouvellesImages.some((_, i) => 
                      previewImages[index] === URL.createObjectURL(nouvellesImages[i])) && (
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Existante
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Label htmlFor="productImages" className="mb-2 block">
                  Ajouter des images
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Glissez-déposez des images ou cliquez pour parcourir
                  </p>
                  <Input
                    id="productImages"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => document.getElementById("productImages")?.click()}>
                    Sélectionner des fichiers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>Optimisation pour les moteurs de recherche</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_titre">Titre SEO</Label>
                  <Input
                    id="seo_titre"
                    value={editedArticle.seo_titre || ""}
                    onChange={(e) => handleChange("seo_titre", e.target.value)}
                    placeholder="Titre optimisé pour le référencement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mots_cles_seo">Mots-clés (séparés par des virgules)</Label>
                  <Input
                    id="mots_cles_seo"
                    value={editedArticle.mots_cles_seo || ""}
                    onChange={(e) => handleChange("mots_cles_seo", e.target.value)}
                    placeholder="mots,clés,importants"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Enregistrer les modifications</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}