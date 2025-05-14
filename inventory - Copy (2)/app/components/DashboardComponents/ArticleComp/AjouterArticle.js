"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CustomDropdown from "../CustomDropdown"
import { toast, Toaster } from "sonner"
import { useAuth } from "@/app/contexts/AuthContext"
import { CouleurDropdown } from "../CouleurComp/couleurDropdown"

export default function AjouterArticle() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    nom_produit: "",
    description: "",
    prix: "",
    predictedPrice: "",
    remise: "0",
    sku: "",
    seo_titre: "",
    mots_cles_seo: "",
    categorie_id: "",
    marque_id: "",
    genre_id: "",
    variations: [],
    conseils: "",
    images_par_couleur: {},
  })

  const [categories, setCategories] = useState([])
  const [marques, setMarques] = useState([])
  const [genres, setGenres] = useState([])
  const [taillesDisponibles, setTaillesDisponibles] = useState([])
  const [couleurs, setCouleurs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMainCategory, setSelectedMainCategory] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPredicting, setIsPredicting] = useState(false)
  const [articleCount, setArticleCount] = useState(0)
  const [predictionError, setPredictionError] = useState(null)
  const [tailleDropdownOpen, setTailleDropdownOpen] = useState({})

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!user?.token) {
          toast.error("Veuillez vous connecter")
          return
        }

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }

        const [categoriesRes, marquesRes, genresRes, couleursRes, countRes] = await Promise.all([
          axios.get("http://localhost:5000/categories", config),
          axios.get("http://localhost:5000/marques", config),
          axios.get("http://localhost:5000/genres", config),
          axios.get("http://localhost:5000/couleurs", config),
          axios.get("http://localhost:5000/articles/count", config)
        ])

        setCategories(categoriesRes.data)
        setMarques(marquesRes.data)
        setGenres(genresRes.data)
        setCouleurs(couleursRes.data)
        setArticleCount(countRes.data.count || 0)
        
        const generatedSKU = `ARTICLE-${String(countRes.data.count + 1).padStart(3, "0")}`
        setFormData(prev => ({ ...prev, sku: generatedSKU }))
      } catch (error) {
        console.error("Error in fetchInitialData:", error)
        toast.error("Erreur lors du chargement des données initiales")
      }
    }

    fetchInitialData()
  }, [user])

  // Price prediction effect
  useEffect(() => {
    let timer
    const shouldPredict = formData.categorie_id && formData.marque_id && formData.genre_id && formData.variations.length > 0

    if (shouldPredict) {
      setIsPredicting(true)
      setPredictionError(null)

      timer = setTimeout(async () => {
        try {
          const toastId = toast.loading("Calcul du prix estimé...")
          const response = await axios.post("http://127.0.0.1:5000/predict", {
            categorie_id: formData.categorie_id,
            marque_id: formData.marque_id,
            genre_id: formData.genre_id,
            couleur_id: formData.variations[0]?.couleur_id || 1,
            tailles: formData.variations.map(v => v.taille_id),
            quantite_totale: formData.variations.reduce((sum, v) => sum + v.quantite, 0) || 1,
          }, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            timeout: 10000,
          })

          if (!response.data.predicted_price) throw new Error("Invalid response format")

          setFormData(prev => ({
            ...prev,
            predictedPrice: response.data.predicted_price,
            prix: prev.prix || response.data.predicted_price,
          }))

          toast.success(`Prix estimé: ${response.data.predicted_price} DT`, { id: toastId })
        } catch (error) {
          console.error("Prediction error:", error)
          setPredictionError(error.message)
          toast.error("Échec de l'estimation du prix", { id: toastId })
        } finally {
          setIsPredicting(false)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [formData.categorie_id, formData.marque_id, formData.genre_id, formData.variations, user?.token])

  // SKU generation effect
  useEffect(() => {
    if (formData.nom_produit.trim() && articleCount > 0) {
      const formattedName = formData.nom_produit.trim().replace(/\s+/g, "-").toUpperCase()
      const numericPart = String(articleCount + 1).padStart(3, "0")
      const newSku = `${formattedName}-${numericPart}`

      if (newSku !== formData.sku) {
        setFormData(prev => ({ ...prev, sku: newSku }))
      }
    }
  }, [formData.nom_produit, articleCount])

  // Subcategories effect
  useEffect(() => {
    if (!selectedMainCategory) {
      setSubcategories([])
      return
    }

    const selectedCat = categories.find(cat => cat.id === selectedMainCategory)
    if (selectedCat?.sous_categories) {
      setSubcategories(
        selectedCat.sous_categories.map(sub => ({
          value: sub.id,
          label: sub.libelle,
        }))
      )
    } else {
      setSubcategories([])
    }
    setFormData(prev => ({ ...prev, categorie_id: "" }))
  }, [selectedMainCategory, categories])

  // Available sizes effect
  useEffect(() => {
    if (!formData.categorie_id || !formData.genre_id) {
      console.log("Resetting available sizes - no category/genre selected")
      setTaillesDisponibles([])
      // Clear any size selections when category/genre changes
      setFormData(prev => ({
        ...prev,
        variations: prev.variations.filter(v => v.quantite > 0)
      }))
      return
    }

    const fetchTailles = async () => {
      try {
        console.log("Fetching sizes for category:", formData.categorie_id, "and genre:", formData.genre_id)
        const response = await axios.get("http://localhost:5000/tailles", {
          params: {
            categorie_id: formData.categorie_id,
            genre_id: formData.genre_id,
          },
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        })
        console.log("Received sizes:", response.data)
        setTaillesDisponibles(response.data)
      } catch (error) {
        console.error("Error fetching sizes:", error)
        toast.error("Erreur lors du chargement des tailles disponibles")
      }
    }

    fetchTailles()
  }, [formData.categorie_id, formData.genre_id, user?.token])

  const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "Bgtm_D")

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "https://api.cloudinary.com/v1_1/dnkd2ksye/image/upload", true)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response.secure_url)
        } else {
          reject(new Error("Upload failed"))
        }
      }

      xhr.onerror = () => reject(new Error("Upload error"))
      xhr.send(formData)
    })
  }

  const handleTailleQuantiteChange = (couleurId, tailleId, quantite) => {
    setFormData(prev => {
      const existingIndex = prev.variations.findIndex(
        v => v.couleur_id === couleurId && v.taille_id === tailleId
      )

      let newVariations = [...prev.variations]
      
      if (existingIndex >= 0) {
        if (quantite <= 0) {
          // Remove if quantity is 0 or less
          newVariations = newVariations.filter(
            v => !(v.couleur_id === couleurId && v.taille_id === tailleId)
          )
        } else {
          // Update quantity
          newVariations[existingIndex] = { 
            ...newVariations[existingIndex], 
            quantite 
          }
        }
      } else if (quantite > 0) {
        // Add new variation
        newVariations.push({ 
          couleur_id: couleurId, 
          taille_id: tailleId, 
          quantite 
        })
      }

      return {
        ...prev,
        variations: newVariations
      }
    })
  }

  const TailleDropdown = ({ couleurId }) => {
    // Get all selected sizes for this color with quantity > 0
    const selectedSizesForColor = formData.variations
      .filter(v => v.couleur_id === couleurId && v.quantite > 0)
      .map(v => v.taille_id)

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setTailleDropdownOpen(prev => ({
            ...prev,
            [couleurId]: !prev[couleurId]
          }))}
          className="w-full flex justify-between items-center px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <span className="text-xs">
            {taillesDisponibles.length === 0 ? (
              "Sélectionnez d'abord une catégorie et un genre"
            ) : selectedSizesForColor.length > 0 ? (
              `${selectedSizesForColor.length} taille(s) sélectionnée(s)`
            ) : (
              "Sélectionner les tailles"
            )}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-4 transition-transform ${tailleDropdownOpen[couleurId] ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {tailleDropdownOpen[couleurId] && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-52 overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-2 border-b">
              <h3 className="text-xs font-medium text-gray-700">
                {taillesDisponibles.length > 0 ? "Tailles disponibles" : "Tailles non disponibles"}
              </h3>
            </div>

            {taillesDisponibles.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500">
                Veuillez d&apos;abord sélectionner une catégorie et un genre valides
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {taillesDisponibles.map(taille => {
                  const variation = formData.variations.find(
                    v => v.couleur_id === couleurId && v.taille_id === taille.id
                  )
                  const quantite = variation ? variation.quantite : 0
                  const isSelected = quantite > 0

                  return (
                    <div
                      key={taille.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          id={`taille-${couleurId}-${taille.id}`}
                          checked={isSelected}
                          onChange={e => handleTailleQuantiteChange(
                            couleurId, 
                            taille.id, 
                            e.target.checked ? 1 : 0
                          )}
                          className="h-4 w-4 rounded-none border-gray-300 text-black focus:ring-black"
                        />
                        <label 
                          htmlFor={`taille-${couleurId}-${taille.id}`} 
                          className="text-xs cursor-pointer"
                        >
                          {taille.libelle}
                        </label>
                      </div>

                      {isSelected && (
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            value={quantite}
                            onChange={e => {
                              const value = Math.max(1, parseInt(e.target.value) || 1)
                              handleTailleQuantiteChange(couleurId, taille.id, value)
                            }}
                            onBlur={e => {
                              if (!e.target.value || parseInt(e.target.value) < 1) {
                                handleTailleQuantiteChange(couleurId, taille.id, 1)
                              }
                            }}
                            className="w-16 h-8 text-center text-xs border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            onClick={e => e.stopPropagation()}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // 1. Validate required fields
      const requiredFields = {
        nom_produit: !formData.nom_produit,
        prix: !formData.prix || isNaN(formData.prix),
        categorie_id: !formData.categorie_id,
        marque_id: !formData.marque_id,
        genre_id: !formData.genre_id,
        variations: formData.variations.length === 0,
      };
  
      const missingFields = Object.keys(requiredFields).filter(field => requiredFields[field]);
      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(", ")}`);
      }
  
      // 2. Filter and validate variations
      const validVariations = formData.variations
        .filter(v => v.taille_id && v.taille_id !== 0 && v.quantite > 0)
        .map(v => ({
          ...v,
          taille_id: parseInt(v.taille_id),
          couleur_id: parseInt(v.couleur_id),
          quantite: parseInt(v.quantite)
        }));
  
      if (validVariations.length === 0) {
        throw new Error("Veuillez sélectionner au moins une taille valide avec une quantité positive");
      }
  
      // 3. Upload images to Cloudinary
      const uploadedImages = {};
      for (const couleurId in formData.images_par_couleur) {
        const files = formData.images_par_couleur[couleurId];
        uploadedImages[couleurId] = [];
        
        for (const file of files) {
          try {
            const url = await uploadToCloudinary(file);
            uploadedImages[couleurId].push(url);
          } catch (error) {
            console.error(`Error uploading image for color ${couleurId}:`, error);
            throw new Error(`Échec de l'upload des images pour la couleur ${couleurId}`);
          }
        }
      }
  
      // 4. Prepare submission data
      const submissionData = {
        nom_produit: formData.nom_produit,
        description: formData.description,
        conseils: formData.conseils,
        prix: Number.parseFloat(formData.prix),
        remise: Number.parseFloat(formData.remise) || 0,
        sku: formData.sku,
        seo_titre: formData.seo_titre,
        mots_cles_seo: formData.mots_cles_seo,
        categorie_id: formData.categorie_id,
        marque_id: formData.marque_id,
        genre_id: formData.genre_id,
        variations: validVariations,
        images_par_couleur: uploadedImages,
      };
  
      // 5. Submit to backend
      const response = await axios.post(
        "http://localhost:5000/articles/ajouterArticle", 
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
  
      // 6. Success handling
      toast.success("Article ajouté avec succès!");
  
      // 7. Reset form
      setFormData({
        nom_produit: "",
        description: "",
        prix: "",
        predictedPrice: "",
        remise: "0",
        sku: `ARTICLE-${String(articleCount + 1).padStart(3, "0")}`,
        images_par_couleur: {},
        seo_titre: "",
        mots_cles_seo: "",
        categorie_id: "",
        marque_id: "",
        genre_id: "",
        variations: [],
        conseils: "",
      });
      setSelectedMainCategory("");
      setSubcategories([]);
      setUploadProgress(0);
      setArticleCount(prev => prev + 1);
  
    } catch (error) {
      console.error("Erreur:", error);
      
      let errorMessage = error.message;
      if (error.response) {
        // Handle specific backend errors
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data.message || "Données invalides";
            if (error.response.data.invalidVariations) {
              errorMessage += ". Variations invalides: " + 
                JSON.stringify(error.response.data.invalidVariations);
            }
            break;
          case 401: errorMessage = "Non autorisé - Veuillez vous reconnecter"; break;
          case 403: errorMessage = "Permission refusée"; break;
          case 500: 
            errorMessage = error.response.data.message || 
              "Erreur serveur - Veuillez réessayer plus tard";
            break;
          default: 
            errorMessage = error.response.data.message || errorMessage;
        }
      }
  
      toast.error(errorMessage || "Erreur lors de l'ajout de l'article");
    } finally {
      setLoading(false);
    }
  };

  const mainCategoryOptions = categories
    .filter(cat => !cat.parent_id)
    .map(cat => ({ value: cat.id, label: cat.libelle }))

  const genreOptions = genres.map(genre => ({
    value: genre.id,
    label: genre.libelle,
  }))

  return (
    <section className="container mx-auto px-9 py-8 font-mono">
      <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-8">Ajouter un Nouvel Article</h1>

      <Toaster position="top-center" autoClose={3000} />

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-6 bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium">Chargement d&apos;images...</span>
            <span className="text-xs font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* First row - Product name and SKU */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nom du produit *</label>
            <Input
              type="text"
              name="nom_produit"
              value={formData.nom_produit}
              onChange={(e) => setFormData(prev => ({ ...prev, nom_produit: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Référence (SKU)</label>
            <Input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              disabled
            />
          </div>
        </div>

        {/* Second row - Description and Conseils */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Conseils</label>
            <Textarea
              name="conseils"
              value={formData.conseils}
              onChange={(e) => setFormData(prev => ({ ...prev, conseils: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        <hr className="border-gray-300 dark:border-gray-600" />

        {/* Third row - Main category and subcategory */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Catégorie principale *</label>
            <CustomDropdown
              options={mainCategoryOptions}
              value={selectedMainCategory}
              onChange={setSelectedMainCategory}
              placeholder="Sélectionnez une catégorie"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sous-catégorie *</label>
            <CustomDropdown
              options={subcategories}
              value={formData.categorie_id}
              onChange={(value) => setFormData(prev => ({ ...prev, categorie_id: value }))}
              placeholder={
                subcategories.length ? "Sélectionnez une sous-catégorie" : "Choisissez d'abord une catégorie principale"
              }
              disabled={!selectedMainCategory}
              required
            />
          </div>
        </div>

        {/* Fourth row - Brand and Gender */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Marque *</label>
            <CustomDropdown
              options={marques.map(m => ({ value: m.id, label: m.libelle }))}
              value={formData.marque_id}
              onChange={(value) => setFormData(prev => ({ ...prev, marque_id: value }))}
              placeholder="Sélectionnez une marque"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Genre *</label>
            <CustomDropdown
              options={genreOptions}
              value={formData.genre_id}
              onChange={(value) => setFormData(prev => ({ ...prev, genre_id: value }))}
              placeholder="Sélectionnez un genre"
              required
            />
          </div>
        </div>

        {/* Fifth row - Colors and sizes */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Couleurs et Tailles *</label>
          <CouleurDropdown
            couleurs={couleurs}
            setFormData={setFormData}
            formData={formData}
          />

          {/* Size selection for each color */}
          {Array.from(new Set(formData.variations.map(v => v.couleur_id))).map(couleurId => {
            const couleur = couleurs.find(c => c.id === couleurId)
            return (
              <div key={couleurId} className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                    style={{ backgroundColor: couleur?.hexcode || '#ccc' }}
                  />
                  <span className="text-sm font-medium">{couleur?.libelle || 'Couleur inconnue'}</span>
                </div>
                <TailleDropdown couleurId={couleurId} />
              </div>
            )
          })}

          {formData.variations.length === 0 && (
            <p className="text-xs text-red-500 mt-1">Sélectionnez au moins une couleur avec des tailles</p>
          )}
        </div>

        {/* Sixth row - Price and Discount */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Prix (DT) *</label>
            <Input
              type="number"
              name="prix"
              value={formData.prix}
              onChange={(e) => setFormData(prev => ({ ...prev, prix: e.target.value }))}
              required
              min="0"
              step="0.01"
              className={isPredicting ? "animate-pulse bg-gray-100" : ""}
            />
            {formData.predictedPrice && (
              <p className="text-xs text-green-600 mt-1">
                Prix suggéré: {formData.predictedPrice} DT
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, prix: formData.predictedPrice.toString() }))}
                  className="ml-2 text-black hover:underline"
                >
                  Appliquer
                </button>
              </p>
            )}
            {predictionError && (
              <div className="text-xs text-red-500 mt-2">Erreur de prédiction: {predictionError}</div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Remise (%)</label>
            <Input
              type="number"
              name="remise"
              value={formData.remise}
              onChange={(e) => setFormData(prev => ({ ...prev, remise: e.target.value }))}
              min="0"
              max="100"
            />
          </div>
        </div>

        <hr className="border-gray-300 dark:border-gray-600" />

        {/* Seventh row - SEO Title and Keywords */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Titre SEO</label>
            <Input
              type="text"
              name="seo_titre"
              value={formData.seo_titre}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_titre: e.target.value }))}
              placeholder="Titre pour les moteurs de recherche"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mots-clés SEO</label>
            <Input
              type="text"
              name="mots_cles_seo"
              value={formData.mots_cles_seo}
              onChange={(e) => setFormData(prev => ({ ...prev, mots_cles_seo: e.target.value }))}
              placeholder="Mots-clés séparés par des virgules"
            />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            type="submit"
            disabled={loading}
            className={`w-1/3 sm:w-1/4 bg-black text-white p-2 rounded-none hover:bg-white hover:text-black border border-black transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Ajout en cours..." : "Ajouter l'article"}
          </Button>
        </div>
      </form>
    </section>
  )
}