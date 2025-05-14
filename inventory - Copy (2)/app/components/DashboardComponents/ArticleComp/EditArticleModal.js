"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const EditArticleModal = ({ article, onClose, onSave, allData }) => {
  const [formData, setFormData] = useState({
    nom_produit: "",
    description: "",
    conseils: "",
    prix: 0,
    remise: 0,
    stock: 0,
    sku: "",
    marque_id: "",
    genre_id: "",
    categorie_id: "",
    tailles: [],
    tailles_quantites: {},
    couleurs: [],
    seo_titre: "",
    mots_cles_seo: "",
    existingImages: []
  });

  const [filteredTailles, setFilteredTailles] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);

  const fileInputRef = useRef(null);


  useEffect(() => {
    if (article && allData.tailles) {  // Check for allData.tailles
      console.log("✅ Initializing formData with article:", article);
  
      const initialTailles = article.tailles.map(t => t.id.toString());
      const initialTaillesQuantites = article.tailles.reduce((acc, taille) => {
        acc[taille.id] = taille.quantite || taille.ArticleTaille?.quantite || 0;
        return acc;
      }, {});
  
      const initialCouleurs = article.couleurs?.map(c => c.id.toString()) || [];
  
      setFormData({
        nom_produit: article.nom_produit || "",
        description: article.description || "",
        conseils: article.conseils || "",
        prix: article.prix || 0,
        remise: article.remise || 0,
        stock: article.stock || 0,
        sku: article.sku || "",
        marque_id: article.marque?.id?.toString() || "",
        genre_id: article.genre?.id?.toString() || "",
        categorie_id: article.categorie?.id?.toString() || "",
        tailles: initialTailles,
        tailles_quantites: initialTaillesQuantites,
        couleurs: initialCouleurs,
        seo_titre: article.seo_titre || "",
        mots_cles_seo: article.mots_cles_seo || "",
        existingImages: article.existingImages || article.images || []
      });
  
      setIsLoading(false);
    }
  }, [article, allData.tailles]);  // Add allData.tailles to dependencies


  useEffect(() => {
    const timer = setTimeout(() => {
      const genreId = formData.genre_id;
      const categorieId = formData.categorie_id;
      const tailles = allData.tailles;
  
      console.log("🔁 useEffect triggered");
      console.log("formData.genre_id:", genreId);
      console.log("formData.categorie_id:", categorieId);
      console.log("allData.tailles:", tailles);
  
      const canFilter =
        genreId &&
        categorieId &&
        Array.isArray(tailles) &&
        tailles.length > 0;
  
      if (canFilter) {
        const filtered = tailles.filter(
          t =>
            t.genre_id?.toString() === genreId.toString() &&
            t.categorie_id?.toString() === categorieId.toString()
        );
  
        console.log("✅ Filtered tailles:", filtered);
        setFilteredTailles(filtered);
      }
    }, 300); // Delay to wait for state updates
  
    return () => clearTimeout(timer);
  }, [formData.genre_id, formData.categorie_id, allData.tailles]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === "nom_produit") {
      const sku = value
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9-]/g, '')
        .substring(0, 20);
      setFormData(prev => ({ ...prev, sku }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      tailles: [], // Reset selected sizes when genre or category changes
      tailles_quantites: {} // Reset quantities too
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentValues = [...prev[field]];
      const valueIndex = currentValues.indexOf(value);
      
      if (valueIndex === -1) {
        currentValues.push(value);
      } else {
        currentValues.splice(valueIndex, 1);
      }
      
      return {
        ...prev,
        [field]: currentValues
      };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.existingImages.length + newImages.length > 5) {
      toast.error("Vous ne pouvez télécharger que jusqu'à 5 images au total");
      return;
    }

    const oversized = files.some(file => file.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Certaines images dépassent la taille maximale de 5MB");
      return;
    }

    setNewImages(prev => [...prev, ...files]);
  };

  const removeImage = (index, isExisting) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index)
      }));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const renderedImages = useMemo(() => {
    const existing = formData.existingImages.map((img, index) => (
      <div key={`existing-${index}`} className="relative group">
        <Image
          src={img}
          alt={`Image produit ${index}`}
          width={120}
          height={120}
          className="rounded-md object-cover h-28 w-28"
        />
        <button
          type="button"
          onClick={() => removeImage(index, true)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    ));

    const newOnes = newImages.map((img, index) => (
      <div key={`new-${index}`} className="relative group">
        <Image
          src={URL.createObjectURL(img)}
          alt={`Nouvelle image ${index}`}
          width={120}
          height={120}
          className="rounded-md object-cover h-28 w-28"
        />
        <button
          type="button"
          onClick={() => removeImage(index, false)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    ));

    return [...existing, ...newOnes];
  }, [formData.existingImages, newImages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const formDataToSend = new FormData();
      
      // Append basic fields
      formDataToSend.append('nom_produit', formData.nom_produit);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('conseils', formData.conseils);
      formDataToSend.append('prix', formData.prix);
      formDataToSend.append('remise', formData.remise);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('marque_id', formData.marque_id);
      formDataToSend.append('genre_id', formData.genre_id);
      formDataToSend.append('categorie_id', formData.categorie_id);
      formDataToSend.append('seo_titre', formData.seo_titre);
      formDataToSend.append('mots_cles_seo', formData.mots_cles_seo);
      
      // Format tailles correctly with quantites
      const taillesWithQuantites = filteredTailles
        .filter(taille => formData.tailles.includes(taille.id.toString()))
        .map(taille => ({
          taille_id: taille.id,
          quantite: formData.tailles_quantites[taille.id] || 0
        }));
      
      formDataToSend.append('tailles', JSON.stringify(taillesWithQuantites));
      
      // Format couleurs
      formDataToSend.append('couleurs', JSON.stringify(formData.couleurs));
      
      // Handle images
      formDataToSend.append('existingImages', JSON.stringify(formData.existingImages));
      
      // Add new images
      newImages.forEach(file => {
        formDataToSend.append('images', file);
      });
  
      const response = await axios.put(
        `http://localhost:5000/articles/${article.id}`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      if (response.data.succes) {
        toast.success("Article mis à jour avec succès");
        onSave(response.data.donnees);
        onClose();
      } else {
        toast.error(response.data.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la mise à jour de l'article");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modifier l&apos;article</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            ×
          </Button>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="associations">Associations</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nom du produit *</Label>
                    <Input
                      name="nom_produit"
                      value={formData.nom_produit}
                      onChange={handleChange}
                      placeholder="Nom du produit"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Description du produit"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Conseils d&apos;utilisation</Label>
                    <Textarea
                      name="conseils"
                      value={formData.conseils}
                      onChange={handleChange}
                      placeholder="Conseils d'utilisation"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Prix (DT) *</Label>
                      <Input
                        name="prix"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.prix}
                        onChange={handleChange}
                        placeholder="Prix"
                        required
                      />
                    </div>
                    <div>
                      <Label>Remise (%)</Label>
                      <Input
                        name="remise"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.remise}
                        onChange={handleChange}
                        placeholder="Remise"
                      />
                    </div>
                    <div>
                      <Label>Stock total *</Label>
                      <Input
                        name="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Stock"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>SKU *</Label>
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="Code SKU"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Le SKU est généré automatiquement à partir du nom du produit
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="associations">
              <Card>
                <CardHeader>
                  <CardTitle>Associations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Marque *</Label>
                      <Select
                        value={formData.marque_id}
                        onValueChange={(value) => handleSelectChange("marque_id", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une marque" />
                        </SelectTrigger>
                        <SelectContent>
                          {allData.marques.map((marque) => (
                            <SelectItem key={marque.id} value={marque.id.toString()}>
                              {marque.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Genre *</Label>
                      <Select
                        value={formData.genre_id}
                        onValueChange={(value) => handleSelectChange("genre_id", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {allData.genres.map((genre) => (
                            <SelectItem key={genre.id} value={genre.id.toString()}>
                              {genre.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Catégorie *</Label>
                      <Select
                        value={formData.categorie_id}
                        onValueChange={(value) => handleSelectChange("categorie_id", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {allData.categories.map((categorie) => (
                            <SelectItem key={categorie.id} value={categorie.id.toString()}>
                              {categorie.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tailles disponibles *</Label>
                    {formData.genre_id && formData.categorie_id ? (
                      filteredTailles.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                          {filteredTailles.map((taille) => (
                            <div key={taille.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`taille-${taille.id}`}
                                checked={formData.tailles.includes(taille.id.toString())}
                                onCheckedChange={() => handleCheckboxChange("tailles", taille.id.toString())}
                              />
                              <label htmlFor={`taille-${taille.id}`} className="text-sm cursor-pointer">
                                {taille.libelle}
                              </label>
                              {formData.tailles.includes(taille.id.toString()) && (
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.tailles_quantites[taille.id] || 0}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    tailles_quantites: {
                                      ...prev.tailles_quantites,
                                      [taille.id]: parseInt(e.target.value) || 0
                                    }
                                  }))}
                                  className="w-20"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">
                          Aucune taille disponible pour cette combinaison genre/catégorie. Vérifiez les données.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        Veuillez sélectionner un genre et une catégorie d&apos;abord
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Couleurs disponibles</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {allData.couleurs.map((couleur) => (
                        <div key={couleur.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`couleur-${couleur.id}`}
                            checked={formData.couleurs.includes(couleur.id.toString())}
                            onCheckedChange={() => handleCheckboxChange("couleurs", couleur.id.toString())}
                          />
                          <label htmlFor={`couleur-${couleur.id}`} className="text-sm cursor-pointer">
                            {couleur.libelle}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre SEO</Label>
                    <Input
                      name="seo_titre"
                      value={formData.seo_titre}
                      onChange={handleChange}
                      placeholder="Titre SEO"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.seo_titre.length}/60 caractères
                    </p>
                  </div>
                  <div>
                    <Label>Mots-clés SEO</Label>
                    <Input
                      name="mots_cles_seo"
                      value={formData.mots_cles_seo}
                      onChange={handleChange}
                      placeholder="Mots-clés séparés par des virgules"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {renderedImages}
                  </div>
                  <div>
                    <Label>Ajouter des images</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="cursor-pointer"
                        ref={fileInputRef}
                        disabled={uploadingImages}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                      >
                        {uploadingImages ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Parcourir"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Téléchargez des images de produit de haute qualité (max 5MB par image, max 5 images au total)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white py-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="min-w-24"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || uploadingImages}
                className="min-w-24"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
};

export default EditArticleModal;