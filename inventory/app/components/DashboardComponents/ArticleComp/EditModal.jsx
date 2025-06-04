// components/articles/EditModal.jsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image" // Assuming you're using Next.js Image component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner" // For toasts
import { XCircle, PlusCircle } from "lucide-react" // Icons for image removal/add

// You will need to fetch these lists from your API
// For now, we'll use placeholder data or fetch them inside the modal if needed
// or pass them as props if they are already fetched in the parent.
// For simplicity in this example, we'll assume they are fetched externally or hardcoded for now.
const DUMMY_GENRES = [{ id: 1, libelle: "Homme" }, { id: 4, libelle: "Femme" }, { id: 2, libelle: "Enfant" }];
const DUMMY_CATEGORIES = [{ id: 13, libelle: "Chemises et blouses" }, { id: 1, libelle: "T-shirts" }, { id: 2, libelle: "Pantalons" }];
const DUMMY_MARQUES = [{ id: 7, libelle: "TLILA" }, { id: 1, libelle: "Nike" }, { id: 2, libelle: "Adidas" }];
const DUMMY_TAILLES = [{ id: 370, libelle: "XS" }, { id: 371, libelle: "S" }, { id: 372, libelle: "M" }, { id: 373, libelle: "L" }, { id: 374, libelle: "XL" }];


export default function EditModal({ article, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    id: article?.id || null,
    nom_produit: article?.nom_produit || "",
    description: article?.description || "",
    conseils: article?.conseils || "",
    prix: article?.prix || 0,
    prix_final: article?.prix_final || 0,
    sku: article?.sku || "",
    stock: article?.stock || 0,
    seo_titre: article?.seo_titre || "",
    mots_cles_seo: article?.mots_cles_seo || "",
    genre_id: article?.genre?.id || "", // Store ID, not libelle
    categorie_id: article?.categorie?.id || "", // Store ID, not libelle
    marque_id: article?.marque?.id || "", // Store ID, not libelle
    couleurs: article?.couleurs || [], // Array of color objects {id, libelle, hexcode}
    images: article?.images || [], // Array of image URLs
    newImages: [], // For new file uploads
    deletedImageIds: [], // To track images to be removed from the server
    tailles_par_couleur: article?.tailles_par_couleur || {}, // Complex object
  })

  // State for dropdown options (genres, categories, brands, sizes)
  // In a real app, you'd fetch these from your API
  const [genres, setGenres] = useState(DUMMY_GENRES);
  const [categories, setCategories] = useState(DUMMY_CATEGORIES);
  const [marques, setMarques] = useState(DUMMY_MARQUES);
  const [allSizes, setAllSizes] = useState(DUMMY_TAILLES);

  useEffect(() => {
    // Update form data when the 'article' prop changes
    if (article) {
      setFormData({
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
        genre_id: article.genre?.id || "",
        categorie_id: article.categorie?.id || "",
        marque_id: article.marque?.id || "",
        couleurs: article.couleurs || [],
        images: article.images_couleurs?.map(img => ({ id: img.id, url: img.image_url, couleur_id: img.couleur_id })) || [], // Ensure images have IDs
        newImages: [],
        deletedImageIds: [],
        tailles_par_couleur: article.tailles_par_couleur || {},
      })
    }
  }, [article])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue, // Ensure it's a number
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...Array.from(e.target.files)],
    }))
  }

  const handleRemoveImage = (imageUrl, imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.url !== imageUrl),
      deletedImageIds: imageId ? [...prev.deletedImageIds, imageId] : prev.deletedImageIds,
    }))
  }

  const handleColorChange = (colorId, field, value) => {
    setFormData(prev => {
      const newCouleurs = prev.couleurs.map(c =>
        c.id === colorId ? { ...c, [field]: value } : c
      );
      return { ...prev, couleurs: newCouleurs };
    });
  };

  const handleSizeQuantityChange = (colorId, sizeId, quantity) => {
    setFormData(prev => {
      const newTaillesParCouleur = { ...prev.tailles_par_couleur };
      if (newTaillesParCouleur[colorId]) {
        const newSizes = newTaillesParCouleur[colorId].tailles.map(s =>
          s.id === sizeId ? { ...s, quantite: parseInt(quantity) || 0 } : s
        );
        newTaillesParCouleur[colorId] = {
          ...newTaillesParCouleur[colorId],
          tailles: newSizes
        };
      }
      return { ...prev, tailles_par_couleur: newTaillesParCouleur };
    });
  };

  const handleAddSizeForColor = (colorId, sizeId) => {
    setFormData(prev => {
      const newTaillesParCouleur = { ...prev.tailles_par_couleur };
      if (!newTaillesParCouleur[colorId]) {
        // If color doesn't exist in sizes_by_color, initialize it
        const color = prev.couleurs.find(c => c.id === colorId);
        newTaillesParCouleur[colorId] = { couleur: color || { id: colorId, libelle: "Unknown Color" }, tailles: [] };
      }

      const selectedSize = allSizes.find(s => s.id === sizeId);
      if (selectedSize && !newTaillesParCouleur[colorId].tailles.some(s => s.id === sizeId)) {
        newTaillesParCouleur[colorId].tailles.push({ ...selectedSize, quantite: 0 });
      }
      return { ...prev, tailles_par_couleur: newTaillesParCouleur };
    });
  };

  const handleRemoveSizeForColor = (colorId, sizeId) => {
    setFormData(prev => {
      const newTaillesParCouleur = { ...prev.tailles_par_couleur };
      if (newTaillesParCouleur[colorId]) {
        newTaillesParCouleur[colorId].tailles = newTaillesParCouleur[colorId].tailles.filter(s => s.id !== sizeId);
        // Optionally, if no sizes are left for a color, remove the color entry entirely
        if (newTaillesParCouleur[colorId].tailles.length === 0) {
          delete newTaillesParCouleur[colorId];
        }
      }
      return { ...prev, tailles_par_couleur: newTaillesParCouleur };
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.nom_produit || !formData.prix || !formData.sku) {
      toast.error("Veuillez remplir les champs obligatoires (Nom, Prix, SKU).")
      return
    }

    try {
      // You might need to restructure formData based on your API's expected format
      // For example, sending genre_id, categorie_id, marque_id instead of objects.
      // Images will be sent as a FormData object, handled by the useArticle hook.

      // Prepare the data for submission
      const dataToSubmit = {
        ...formData,
        // Ensure IDs are numbers
        genre_id: formData.genre_id ? parseInt(formData.genre_id) : null,
        categorie_id: formData.categorie_id ? parseInt(formData.categorie_id) : null,
        marque_id: formData.marque_id ? parseInt(formData.marque_id) : null,
        prix: parseFloat(formData.prix),
        prix_final: parseFloat(formData.prix_final),
        stock: parseInt(formData.stock),
        // For colors and sizes, ensure they are in the format expected by the API
        // This might require more complex mapping depending on your backend
        couleurs: formData.couleurs.map(c => ({ id: c.id, libelle: c.libelle, hexcode: c.hexcode })), // Assuming you just send back the same structure or specific IDs
        tailles_par_couleur: formData.tailles_par_couleur, // This needs careful handling
        // Pass newImages and deletedImageIds separately for the hook to handle
      };


      // Call the onUpdate function passed from ProductTable
      // The onUpdate function in ProductTable (handleSave) will then call updateArticle from useArticle hook.
      // The useArticle hook's updateArticle already expects a FormData object and handles images.
      await onUpdate(dataToSubmit, formData.newImages, formData.deletedImageIds);

      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Failed to save product:", error)
      toast.error("Échec de la mise à jour du produit.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            Apportez des modifications à l'article ici. Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_produit">Nom du produit</Label>
              <Input
                id="nom_produit"
                name="nom_produit"
                value={formData.nom_produit}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix">Prix</Label>
              <Input
                id="prix"
                name="prix"
                type="number"
                step="0.01"
                value={formData.prix}
                onChange={handlePriceChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix_final">Prix Final (si différent)</Label>
              <Input
                id="prix_final"
                name="prix_final"
                type="number"
                step="0.01"
                value={formData.prix_final}
                onChange={handlePriceChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
              />
            </div>

            {/* Dropdowns for Genre, Category, Brand */}
            {/* These should ideally fetch real data from your API */}
            <div className="space-y-2">
              <Label htmlFor="genre_id">Genre</Label>
              <select
                id="genre_id"
                name="genre_id"
                value={formData.genre_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionner un genre</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id}>
                    {genre.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorie_id">Catégorie</Label>
              <select
                id="categorie_id"
                name="categorie_id"
                value={formData.categorie_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marque_id">Marque</Label>
              <select
                id="marque_id"
                name="marque_id"
                value={formData.marque_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionner une marque</option>
                {marques.map(marque => (
                  <option key={marque.id} value={marque.id}>
                    {marque.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 col-span-full">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <div className="space-y-2 col-span-full">
            <Label htmlFor="conseils">Conseils d'entretien</Label>
            <Textarea
              id="conseils"
              name="conseils"
              value={formData.conseils}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* SEO Information */}
          <div className="space-y-2 col-span-full">
            <Label htmlFor="seo_titre">Titre SEO</Label>
            <Input
              id="seo_titre"
              name="seo_titre"
              value={formData.seo_titre}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2 col-span-full">
            <Label htmlFor="mots_cles_seo">Mots-clés SEO</Label>
            <Input
              id="mots_cles_seo"
              name="mots_cles_seo"
              value={formData.mots_cles_seo}
              onChange={handleChange}
            />
          </div>

          {/* Image Management */}
          <div className="space-y-2 col-span-full">
            <Label>Images du produit</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {formData.images.map((img) => (
                <div key={img.url} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                  <Image src={img.url} alt="Product Image" layout="fill" objectFit="cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(img.url, img.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.newImages.map((file, index) => (
                <div key={file.name + index} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                  <Image src={URL.createObjectURL(file)} alt="New Product Image" layout="fill" objectFit="cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      newImages: prev.newImages.filter((_, i) => i !== index)
                    }))}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Label htmlFor="imageUpload" className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
                <Input
                  id="imageUpload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Label>
            </div>
          </div>

          {/* Colors and Sizes Management */}
          <div className="space-y-4 col-span-full border p-4 rounded-md">
            <h3 className="font-semibold text-lg">Gestion des couleurs et tailles</h3>
            {formData.couleurs.length === 0 && <p className="text-muted-foreground">Aucune couleur sélectionnée pour cet article.</p>}
            {formData.couleurs.map((color) => (
              <div key={color.id} className="border p-3 rounded-md space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color.hexcode }} />
                  <span className="font-medium">{color.libelle}</span>
                  {/* Option to remove color from article if needed */}
                  {/* <Button variant="ghost" size="sm" onClick={() => handleRemoveColor(color.id)}>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button> */}
                </div>

                <div className="space-y-2 pl-4">
                  <Label>Tailles pour {color.libelle}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.tailles_par_couleur[color.id]?.tailles.map((size) => (
                      <div key={size.id} className="flex items-center gap-2">
                        <Label htmlFor={`size-${color.id}-${size.id}`} className="w-16">
                          {size.libelle}
                        </Label>
                        <Input
                          id={`size-${color.id}-${size.id}`}
                          type="number"
                          value={size.quantite}
                          onChange={(e) => handleSizeQuantityChange(color.id, size.id, e.target.value)}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSizeForColor(color.id, size.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      onChange={(e) => handleAddSizeForColor(color.id, parseInt(e.target.value))}
                      value="" // Reset select after selection
                    >
                      <option value="" disabled>Ajouter une taille</option>
                      {allSizes.filter(s => !formData.tailles_par_couleur[color.id]?.tailles.some(ts => ts.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.libelle}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer les modifications</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}