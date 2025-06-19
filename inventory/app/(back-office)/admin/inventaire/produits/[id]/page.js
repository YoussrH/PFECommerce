"use client"
import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CustomDropdown from "@/components/ui/custom-dropdown"
import { toast, Toaster } from "sonner"
import { useAuth } from "@/app/contexts/AuthContext"
import { CouleurDropdown } from "@/app/components/DashboardComponents/CouleurComp/couleurDropdown"
import { useParams, useRouter } from "next/navigation"
import { useArticle } from "@/hooks/useArticle"
import useCatalog from "@/hooks/useCatalog"

export default function EditArticlePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { fetchArticleById, updateArticle } = useArticle()
  const {
    categories,
    marques,
    genres,
    fetchAllCategories,
    fetchAllMarques,
    fetchAllGenres
  } = useCatalog()
  const router = useRouter()

  const [formData, setFormData] = useState({
    nom_produit: "",
    description: "",
    conseils: "",
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
    images_par_couleur: {}
  })
  const [taillesDisponibles, setTaillesDisponibles] = useState([])
  const [couleurs, setCouleurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMainCategory, setSelectedMainCategory] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionError, setPredictionError] = useState(null)
  const [tailleDropdownOpen, setTailleDropdownOpen] = useState({})
  const [existingImages, setExistingImages] = useState({})

  // Effect to load all catalog data
  useEffect(() => {
    const loadCatalogData = async () => {
      await Promise.all([
        fetchAllCategories(),
        fetchAllMarques(),
        fetchAllGenres()
      ])
    }
    loadCatalogData()
  }, [fetchAllCategories, fetchAllMarques, fetchAllGenres])

  // Effect to fetch article data
  useEffect(() => {
// In the fetchData function within the useEffect for fetching article data
const fetchData = async () => {
  if (!id || categories.length === 0 || marques.length === 0 || genres.length === 0) {
    return
  }

  setLoading(true)
  try {
    const [couleursRes, articleResponse] = await Promise.all([
      axios.get("http://localhost:5000/couleurs", { withCredentials: true }),
      fetchArticleById(id)
    ])

    setCouleurs(couleursRes.data)

    if (articleResponse?.success && articleResponse.donnees) {
      const article = articleResponse.donnees

      // Prepare images by color
      const imagesByColor = {}
      if (article.images_couleurs) {
        article.images_couleurs.forEach(img => {
          if (!imagesByColor[img.couleur_id]) {
            imagesByColor[img.couleur_id] = []
          }
          imagesByColor[img.couleur_id].push(img.image_url)
        })
      }
      setExistingImages(imagesByColor)

      // Set form data first to ensure we have categorie_id and genre_id
      setFormData(prev => ({
        ...prev,
        nom_produit: article.nom_produit || "",
        description: article.description || "",
        conseils: article.conseils || "",
        prix: article.prix?.toString() || "",
        predictedPrice: article.prix?.toString() || "",
        remise: article.remise?.toString() || "0",
        sku: article.sku || "",
        seo_titre: article.seo_titre || "",
        mots_cles_seo: article.mots_cles_seo || "",
        categorie_id: article.categorie_id || "",
        marque_id: article.marque_id || "",
        genre_id: article.genre_id || "",
        variations: [] // Initialize empty, we'll set this after fetching tailles
      }))

      // Set selected main category and subcategories
      const mainCategory = categories.find(cat =>
        cat.sous_categories?.some(sub => sub.id === article.categorie_id)
      ) || categories.find(cat => cat.id === article.categorie_id)

      if (mainCategory) {
        setSelectedMainCategory(mainCategory.id)
        setSubcategories(
          (mainCategory.sous_categories || []).map(sub => ({
            value: sub.id,
            label: sub.libelle,
          }))
        )
      }

      // Now fetch tailles for this article's category and genre
      if (article.categorie_id && article.genre_id) {
        const taillesResponse = await axios.get("http://localhost:5000/tailles", {
          params: {
            categorie_id: article.categorie_id,
            genre_id: article.genre_id,
          },
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        setTaillesDisponibles(taillesResponse.data)

        // Now set the variations with the proper taille data
        const initialVariations = article.variations?.map(v => ({
          couleur_id: v.couleur_id,
          taille_id: v.taille_id,
          quantite: v.quantite
        })) || []

        setFormData(prev => ({
          ...prev,
          variations: initialVariations
        }))
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    toast.error("Erreur lors du chargement des données")
  } finally {
    setLoading(false)
  }
}

    fetchData()
  }, [id, categories, marques, genres, fetchArticleById, router])

  // Effect to fetch available sizes when category or genre changes
  useEffect(() => {
    if (!formData.categorie_id || !formData.genre_id || !user?.token) {
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
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
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
        newVariations = newVariations.filter(
          v => !(v.couleur_id === couleurId && v.taille_id === tailleId)
        )
      } else {
        newVariations[existingIndex] = {
          ...newVariations[existingIndex],
          quantite: parseInt(quantite)
        }
      }
    } else if (quantite > 0) {
      newVariations.push({
        couleur_id: couleurId,
        taille_id: tailleId,
        quantite: parseInt(quantite)
      })
    }

    return {
      ...prev,
      variations: newVariations
    }
  })
}

const TailleDropdown = useCallback(({ couleurId }) => {
  const selectedSizesForColor = formData.variations
    .filter(v => v.couleur_id === couleurId && v.quantite > 0)
    .map(v => v.taille_id)

  // Get the quantities for each taille
  const getQuantityForTaille = (tailleId) => {
    const variation = formData.variations.find(
      v => v.couleur_id === couleurId && v.taille_id === tailleId
    )
    return variation ? variation.quantite : 0
  }

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
          {selectedSizesForColor.length > 0 ? (
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
            <h3 className="text-dm font-medium text-gray-700">
              Tailles disponibles
            </h3>
          </div>

          <div className="p-2 space-y-1">
            {taillesDisponibles.length > 0 ? (
              taillesDisponibles.map(taille => {
                const quantite = getQuantityForTaille(taille.id)
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
                          e.target.checked ? (quantite || 1) : 0
                        )}
                        className="h-4 w-4 rounded-none border-gray-300 text-black focus:ring-black"
                      />
                      <label
                        htmlFor={`taille-${couleurId}-${taille.id}`}
                        className="text-dm cursor-pointer"
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
                          className="w-16 h-8 text-center text-dm border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-2 text-xs text-gray-500">
                Aucune taille disponible pour cette catégorie et ce genre.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}, [formData.variations, taillesDisponibles, tailleDropdownOpen])
/*   const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requiredFields = {
        nom_produit: !formData.nom_produit,
        prix: !formData.prix || isNaN(formData.prix),
        categorie_id: !formData.categorie_id,
        marque_id: !formData.marque_id,
        genre_id: !formData.genre_id,
        variations: formData.variations.length === 0,
      }

      const missingFields = Object.keys(requiredFields).filter(field => requiredFields[field])
      if (missingFields.length > 0) {
        const fieldNamesMap = {
          nom_produit: "Nom du produit",
          prix: "Prix",
          categorie_id: "Sous-catégorie",
          marque_id: "Marque",
          genre_id: "Genre",
          variations: "Couleurs et Tailles"
        }
        const displayMissingFields = missingFields.map(field => fieldNamesMap[field] || field).join(", ")
        throw new Error(`Champs obligatoires manquants: ${displayMissingFields}`)
      }

      const validVariations = formData.variations
        .filter(v => v.taille_id && v.taille_id !== 0 && v.quantite > 0)
        .map(v => ({
          ...v,
          taille_id: parseInt(v.taille_id),
          couleur_id: parseInt(v.couleur_id),
          quantite: parseInt(v.quantite)
        }))

      if (validVariations.length === 0) {
        throw new Error("Veuillez sélectionner au moins une taille valide avec une quantité positive pour une couleur sélectionnée.")
      }

      const uploadedImages = {}
      for (const couleurId in formData.images_par_couleur) {
        const files = formData.images_par_couleur[couleurId]
        if (files && files.length > 0) {
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
      }

      const allImages = {}
      for (const couleurId in existingImages) {
        allImages[couleurId] = [...existingImages[couleurId]]
      }
      for (const couleurId in uploadedImages) {
        if (!allImages[couleurId]) {
          allImages[couleurId] = []
        }
        allImages[couleurId].push(...uploadedImages[couleurId])
      }

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
        images_par_couleur: allImages,
      }

      const response = await updateArticle(id, submissionData)

      if (response) {
        toast.success("Article mis à jour avec succès!")
        router.push("/admin/inventaire/produits")
      }
    } catch (error) {
      console.error("Erreur:", error)

      let errorMessage = error.message
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data.message || "Données invalides"
            if (error.response.data.invalidVariations) {
              errorMessage += ". Variations invalides: " +
                JSON.stringify(error.response.data.invalidVariations)
            }
            break
          case 401: errorMessage = "Non autorisé - Veuillez vous reconnecter"; break
          case 403: errorMessage = "Permission refusée"; break
          case 500:
            errorMessage = error.response.data.message ||
              "Erreur serveur - Veuillez réessayer plus tard"
            break
          default:
            errorMessage = error.response.data.message || errorMessage
        }
      }

      toast.error(errorMessage || "Erreur lors de la mise à jour de l'article")
    } finally {
      setLoading(false)
    }
  } */

    const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const requiredFields = {
      nom_produit: !formData.nom_produit,
      prix: !formData.prix || isNaN(formData.prix),
      categorie_id: !formData.categorie_id,
      marque_id: !formData.marque_id,
      genre_id: !formData.genre_id,
      variations: formData.variations.length === 0,
    }

    const missingFields = Object.keys(requiredFields).filter(field => requiredFields[field])
    if (missingFields.length > 0) {
      const fieldNamesMap = {
        nom_produit: "Nom du produit",
        prix: "Prix",
        categorie_id: "Sous-catégorie",
        marque_id: "Marque",
        genre_id: "Genre",
        variations: "Couleurs et Tailles"
      }
      const displayMissingFields = missingFields.map(field => fieldNamesMap[field] || field).join(", ")
      throw new Error(`Champs obligatoires manquants: ${displayMissingFields}`)
    }

    const validVariations = formData.variations
      .filter(v => v.taille_id && v.taille_id !== 0 && v.quantite > 0)
      .map(v => ({
        ...v,
        taille_id: parseInt(v.taille_id),
        couleur_id: parseInt(v.couleur_id),
        quantite: parseInt(v.quantite)
      }))

    if (validVariations.length === 0) {
      throw new Error("Veuillez sélectionner au moins une taille valide avec une quantité positive pour une couleur sélectionnée.")
    }

    // Process images - existing ones are already URLs, new ones need upload
    const allImages = {}
    
    // First include all existing images
    for (const couleurId in existingImages) {
      allImages[couleurId] = [...existingImages[couleurId]]
    }

    // Then upload and add new images
    for (const couleurId in formData.images_par_couleur) {
      if (!allImages[couleurId]) {
        allImages[couleurId] = []
      }
      
      // Upload each new file
      const uploadPromises = formData.images_par_couleur[couleurId].map(async (file) => {
        try {
          const url = await uploadToCloudinary(file)
          return url
        } catch (error) {
          console.error(`Error uploading image for color ${couleurId}:`, error)
          return null
        }
      })

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null)
      allImages[couleurId].push(...uploadedUrls)
    }

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
      images_par_couleur: allImages,
    }

    const response = await updateArticle(id, submissionData)

    if (response) {
      router.push("/admin/inventaire/produits")
    }
  } catch (error) {
    console.error("Erreur:", error)

    let errorMessage = error.message
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data.message || "Données invalides"
          if (error.response.data.invalidVariations) {
            errorMessage += ". Variations invalides: " +
              JSON.stringify(error.response.data.invalidVariations)
          }
          break
        case 401: errorMessage = "Non autorisé - Veuillez vous reconnecter"; break
        case 403: errorMessage = "Permission refusée"; break
        case 500:
          errorMessage = error.response.data.message ||
            "Erreur serveur - Veuillez réessayer plus tard"
          break
        default:
          errorMessage = error.response.data.message || errorMessage
      }
    }

    toast.error(errorMessage || "Erreur lors de la mise à jour de l'article")
  } finally {
    setLoading(false)
  }
}
  if (loading || !formData || categories.length === 0 || marques.length === 0 || genres.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  const mainCategoryOptions = categories
    .filter(cat => !cat.parent_id)
    .map(cat => ({ value: cat.id, label: cat.libelle }))

  const genreOptions = genres.map(genre => ({
    value: genre.id,
    label: genre.libelle,
  }))

  const marqueOptions = marques.map(marque => ({
    value: marque.id,
    label: marque.libelle,
  }))

  return (
    <section className="container mx-auto p-4 font-mono">
      <h1 className="text-xl font-bold text-black dark:text-white mb-8">Modifier l&lsquo;Article</h1>

      <Toaster position="top-center" richColors />

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-6 bg-gray-100 p-12 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-dm font-medium">Chargement d&apos;images...</span>
            <span className="text-dm font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 bg-white p-9 rounded-3xl shadow-lg dark:bg-gray-800">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Nom du produit *</label>
            <Input
              type="text"
              name="nom_produit"
              value={formData.nom_produit}
              onChange={(e) => setFormData(prev => ({ ...prev, nom_produit: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Référence (SKU)</label>
            <Input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              disabled
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Conseils</label>
            <Textarea
              name="conseils"
              value={formData.conseils}
              onChange={(e) => setFormData(prev => ({ ...prev, conseils: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        <hr className="border-gray-300 dark:border-gray-600" />

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Catégorie principale *</label>
            <CustomDropdown
              options={mainCategoryOptions}
              value={selectedMainCategory}
              onChange={setSelectedMainCategory}
              placeholder="Sélectionnez une catégorie"
              required
            />
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Sous-catégorie *</label>
            <CustomDropdown
              options={subcategories}
              value={formData.categorie_id}
              onChange={(value) => setFormData(prev => ({ ...prev, categorie_id: value }))}
              placeholder={
                subcategories.length ? "Sélectionnez une sous-catégorie" : "Choisissez d'abord une catégorie principale"
              }
              disabled={!selectedMainCategory || subcategories.length === 0}
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Marque *</label>
            <CustomDropdown
              options={marqueOptions}
              value={formData.marque_id}
              onChange={(value) => setFormData(prev => ({ ...prev, marque_id: value }))}
              placeholder="Sélectionnez une marque"
              required
            />
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Genre *</label>
            <CustomDropdown
              options={genreOptions}
              value={formData.genre_id}
              onChange={(value) => setFormData(prev => ({ ...prev, genre_id: value }))}
              placeholder="Sélectionnez un genre"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Couleurs et Images *</label>
          {/*
            IMPORTANT: The 'CouleurDropdown' component is responsible for rendering and managing existing images.
            If images are still not showing correctly when its icon is clicked,
            the fix needs to be implemented within 'CouleurDropdown.js' itself.
            Ensure it correctly iterates over 'existingImages' and displays them.
          */}
<CouleurDropdown
  couleurs={couleurs}
  setFormData={setFormData}
  formData={formData}
  existingImages={existingImages}
  setExistingImages={setExistingImages}
/>
          {Array.from(new Set(formData.variations.map(v => v.couleur_id))).map(couleurId => {
            const couleur = couleurs.find(c => c.id === couleurId)
            if (!couleur) return null
            return (
              <div key={couleurId} className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center mb-3">
                  <div
                    className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                    style={{ backgroundColor: couleur?.hexcode || '#ccc' }}
                  />
                  <span className="text-dm font-medium">{couleur?.libelle || 'Couleur inconnue'}</span>
                </div>
                <TailleDropdown couleurId={couleurId} />
              </div>
            )
          })}

          {formData.variations.length === 0 && (
            <p className="text-dm text-red-500 mt-1">Sélectionnez au moins une couleur avec des tailles et quantités.</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Prix (DT) *</label>
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
              <p className="text-dm text-green-600 mt-1">
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
              <div className="text-dm text-red-500 mt-2">Erreur de prédiction: {predictionError}</div>
            )}
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Remise (%)</label>
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

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Titre SEO</label>
            <Input
              type="text"
              name="seo_titre"
              value={formData.seo_titre}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_titre: e.target.value }))}
              placeholder="Titre pour les moteurs de recherche"
            />
          </div>

          <div>
            <label className="text-dm font-medium text-gray-700 dark:text-gray-300">Mots-clés SEO</label>
            <Input
              type="text"
              name="mots_cles_seo"
              value={formData.mots_cles_seo}
              onChange={(e) => setFormData(prev => ({ ...prev, mots_cles_seo: e.target.value }))}
              placeholder="Mots-clés séparés par des virgules"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <Button
            type="button"
            onClick={() => router.push("/admin/inventaire/produits")}
            className="w-1/3 sm:w-1/4 bg-gray-300 text-black p-2 rounded-md hover:bg-gray-400 transition"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={`w-1/3 sm:w-1/4 bg-black text-white p-2 rounded-md hover:bg-white hover:text-black border border-orange-800 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </section>
  )
}