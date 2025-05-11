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
    tailles: [],
    couleurs: [],
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
  const [tailleDropdownOpen, setTailleDropdownOpen] = useState(false)

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

        const categoriesRes = await axios.get("http://localhost:5000/categories", config)
        setCategories(categoriesRes.data)

        const marquesRes = await axios.get("http://localhost:5000/marques", config)
        setMarques(marquesRes.data)

        const genresRes = await axios.get("http://localhost:5000/genres", config)
        setGenres(genresRes.data)

        const couleursRes = await axios.get("http://localhost:5000/couleurs", config)
        setCouleurs(couleursRes.data)

        const countRes = await axios.get("http://localhost:5000/articles/count", config)
        const count = countRes.data.count || 0
        setArticleCount(count)

        const generatedSKU = `ARTICLE-${String(count + 1).padStart(3, "0")}`
        setFormData((prev) => ({ ...prev, sku: generatedSKU }))
      } catch (error) {
        console.error("Error in fetchInitialData:", error)
        toast.error("Erreur lors du chargement des données initiales")
      }
    }

    fetchInitialData()
  }, [user])

  // Handle price prediction
  useEffect(() => {
    let timer
    const shouldPredict =
      formData.categorie_id && formData.marque_id && formData.genre_id && formData.tailles.length > 0

    if (shouldPredict) {
      setIsPredicting(true)
      setPredictionError(null)

      timer = setTimeout(async () => {
        try {
          const toastId = toast.loading("Calcul du prix estimé...")

          const predictionData = {
            categorie_id: formData.categorie_id,
            marque_id: formData.marque_id,
            genre_id: formData.genre_id,
            couleur_id: formData.couleurs[0] || 1,
            tailles: formData.tailles.map((t) => t.taille_id),
            quantite_totale: formData.tailles.reduce((sum, t) => sum + t.quantite, 0) || 1,
          }

          const response = await axios.post("http://127.0.0.1:5000/predict", predictionData, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            timeout: 10000,
          })

          if (!response.data.predicted_price) {
            throw new Error("Invalid response format")
          }

          setFormData((prev) => ({
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
  }, [formData.categorie_id, formData.marque_id, formData.genre_id, formData.tailles, formData.couleurs, user?.token])

  // Handle SKU generation
  useEffect(() => {
    if (formData.nom_produit.trim() && articleCount > 0) {
      const formattedName = formData.nom_produit.trim().replace(/\s+/g, "-").toUpperCase()

      const numericPart = String(articleCount + 1).padStart(3, "0")
      const newSku = `${formattedName}-${numericPart}`

      if (newSku !== formData.sku) {
        setFormData((prev) => ({ ...prev, sku: newSku }))
      }
    }
  }, [formData.nom_produit, articleCount])

  // Handle subcategories
  useEffect(() => {
    if (!selectedMainCategory) {
      setSubcategories([])
      return
    }

    const selectedCat = categories.find((cat) => cat.id === selectedMainCategory)
    if (selectedCat?.sous_categories) {
      setSubcategories(
        selectedCat.sous_categories.map((sub) => ({
          value: sub.id,
          label: sub.libelle,
        })),
      )
    } else {
      setSubcategories([])
    }
    setFormData((prev) => ({ ...prev, categorie_id: "" }))
  }, [selectedMainCategory, categories])

  // Handle available sizes
  useEffect(() => {
    if (!formData.categorie_id || !formData.genre_id) {
      setTaillesDisponibles([])
      return
    }

    const fetchTailles = async () => {
      try {
        const response = await axios.get("http://localhost:5000/tailles", {
          params: {
            categorie_id: formData.categorie_id,
            genre_id: formData.genre_id,
          },
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        })
        setTaillesDisponibles(response.data)
      } catch (error) {
        toast.error("Erreur lors du chargement des tailles disponibles")
      }
    }

    fetchTailles()
  }, [formData.categorie_id, formData.genre_id, user?.token])

  // Cloudinary upload function
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

  // Handle size quantity change
  const handleTailleQuantiteChange = (tailleId, quantite) => {
    setFormData((prev) => {
      const existingIndex = prev.tailles.findIndex((t) => t.taille_id === tailleId)

      if (existingIndex >= 0) {
        if (quantite <= 0) {
          return {
            ...prev,
            tailles: prev.tailles.filter((t) => t.taille_id !== tailleId),
          }
        } else {
          const newTailles = [...prev.tailles]
          newTailles[existingIndex] = { ...newTailles[existingIndex], quantite }
          return { ...prev, tailles: newTailles }
        }
      } else if (quantite > 0) {
        return {
          ...prev,
          tailles: [...prev.tailles, { taille_id: tailleId, quantite }],
        }
      }
      return prev
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      const requiredFields = {
        nom_produit: !formData.nom_produit,
        prix: !formData.prix || isNaN(formData.prix),
        categorie_id: !formData.categorie_id,
        marque_id: !formData.marque_id,
        genre_id: !formData.genre_id,
        tailles: formData.tailles.length === 0,
        couleurs: formData.couleurs.length === 0,
      }

      const missingFields = Object.keys(requiredFields).filter((field) => requiredFields[field])
      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(", ")}`)
      }

      // Upload images to Cloudinary
      const uploadedImages = {}

      for (const couleurId in formData.images_par_couleur) {
        const files = formData.images_par_couleur[couleurId]
        uploadedImages[couleurId] = []

        for (const file of files) {
          try {
            const url = await uploadToCloudinary(file)
            uploadedImages[couleurId].push(url)
          } catch (error) {
            console.error(`Error uploading image for color ${couleurId}:`, error)
            throw new Error(`Échec de l'upload des images pour la couleur ${couleurId}`)
          }
        }
      }

      // Prepare submission data
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
        tailles: formData.tailles.map((t) => ({
          taille_id: t.taille_id,
          quantite: Number.parseInt(t.quantite),
        })),
        couleurs: formData.couleurs,
        images_par_couleur: uploadedImages,
      }

      const response = await axios.post("http://localhost:5000/articles/ajouterArticle", submissionData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      })

      toast.success("Article ajouté avec succès!")

      // Reset form
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
        tailles: [],
        couleurs: [],
        conseils: "",
      })
      setSelectedMainCategory("")
      setSubcategories([])
      setUploadProgress(0)
      setArticleCount((prev) => prev + 1)
    } catch (error) {
      console.error("Erreur:", error)
      let errorMessage = error.message

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data.message || "Données invalides"
            break
          case 401:
            errorMessage = "Non autorisé - Veuillez vous reconnecter"
            break
          case 403:
            errorMessage = "Permission refusée"
            break
          case 500:
            errorMessage = "Erreur serveur - Veuillez réessayer plus tard"
            break
          default:
            errorMessage = error.response.data.message || errorMessage
        }
      }

      toast.error(errorMessage || "Erreur lors de l'ajout de l'article")
    } finally {
      setLoading(false)
    }
  }

  // Custom Size dropdown component (without using predefined UI components)
  const TailleDropdown = () => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setTailleDropdownOpen(!tailleDropdownOpen)}
          className="w-full flex justify-between items-center px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <span className="text-xs">
            {formData.tailles.length > 0
              ? `${formData.tailles.length} taille(s) sélectionnée(s)`
              : "Sélectionner les tailles"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-4 transition-transform ${tailleDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {tailleDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border
           border-gray-300 rounded-md shadow-lg max-h-52 overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-2 border-b ">
              <h3 className="text-xs font-medium text-gray-700">Tailles disponibles</h3>
            </div>

            {taillesDisponibles.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500">Sélectionnez d&apos;abord une catégorie et un genre</div>
            ) : (
              <div className="p-2 space-y-1">
                {taillesDisponibles.map((taille) => {
                  const selectedTaille = formData.tailles.find((t) => t.taille_id === taille.id)
                  const quantite = selectedTaille ? selectedTaille.quantite : 0

                  return (
                    <div
                      key={taille.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          id={`taille-${taille.id}`}
                          checked={quantite > 0}
                          onChange={(e) => handleTailleQuantiteChange(taille.id, e.target.checked ? 1 : 0)}
                          className="h-4 w-4 rounded-none border-gray-300 text-black focus:ring-black"
                        />
                        <label htmlFor={`taille-${taille.id}`} className="text-xs cursor-pointer">
                          {taille.libelle}
                        </label>
                      </div>

                      {quantite > 0 && (
                       <div className="flex items-center">
                       
                       <input
                         type="number"
                         min="1"
                         value={quantite}
                         onChange={(e) => {
                           const value = Math.max(1, parseInt(e.target.value) || 1);
                           handleTailleQuantiteChange(taille.id, value);
                         }}
                         onBlur={(e) => {
                           if (!e.target.value || parseInt(e.target.value) < 1) {
                             handleTailleQuantiteChange(taille.id, 1);
                           }
                         }}
                         className="w-16 h-8 text-center text-xs border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                         onClick={(e) => e.stopPropagation()}
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

  // Prepare dropdown options
  const mainCategoryOptions = categories
    .filter((cat) => !cat.parent_id)
    .map((cat) => ({ value: cat.id, label: cat.libelle }))

  const genreOptions = genres.map((genre) => ({
    value: genre.id,
    label: genre.libelle,
  }))

  return (
    <section className="container mx-auto px-9 py-8 font-mono">
      <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-8">Ajouter un Nouvel Article</h1>

      <Toaster position="top-center" autoClose={3000} />

      {/* Upload progress indicator */}
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
        {/* First row - Product name and SKU side by side */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nom du produit *</label>
            <Input
              type="text"
              name="nom_produit"
              value={formData.nom_produit}
              onChange={(e) => setFormData((prev) => ({ ...prev, nom_produit: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Référence (SKU)</label>
            <Input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
              disabled
            />
          </div>
        </div>

        {/* Second row - Description and Conseils side by side */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Conseils</label>
            <Textarea
              name="conseils"
              value={formData.conseils}
              onChange={(e) => setFormData((prev) => ({ ...prev, conseils: e.target.value }))}
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
              onChange={(value) => setFormData((prev) => ({ ...prev, categorie_id: value }))}
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
              options={marques.map((m) => ({ value: m.id, label: m.libelle }))}
              value={formData.marque_id}
              onChange={(value) => setFormData((prev) => ({ ...prev, marque_id: value }))}
              placeholder="Sélectionnez une marque"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Genre *</label>
            <CustomDropdown
              options={genreOptions}
              value={formData.genre_id}
              onChange={(value) => setFormData((prev) => ({ ...prev, genre_id: value }))}
              placeholder="Sélectionnez un genre"
              required
            />
          </div>
        </div>

        {/* Fifth row - Sizes and Colors */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tailles et Quantités *</label>
            <TailleDropdown />
            {formData.tailles.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Sélectionnez au moins une taille avec quantité</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Couleurs *</label>
            <CouleurDropdown
              couleurs={couleurs}
              selectedColors={formData.couleurs}
              setFormData={setFormData}
              setCouleurs={setCouleurs}
              formData={formData}
            />
          </div>
        </div>

        {/* Sixth row - Price and Discount */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Prix (DT) *</label>
            <Input
              type="number"
              name="prix"
              value={formData.prix}
              onChange={(e) => setFormData((prev) => ({ ...prev, prix: e.target.value }))}
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
                  onClick={() => setFormData((prev) => ({ ...prev, prix: formData.predictedPrice.toString() }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, remise: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, seo_titre: e.target.value }))}
              placeholder="Titre pour les moteurs de recherche"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mots-clés SEO</label>
            <Input
              type="text"
              name="mots_cles_seo"
              value={formData.mots_cles_seo}
              onChange={(e) => setFormData((prev) => ({ ...prev, mots_cles_seo: e.target.value }))}
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
