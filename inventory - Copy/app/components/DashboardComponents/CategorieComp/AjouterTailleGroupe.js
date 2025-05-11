"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { toast, Toaster } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Save } from "lucide-react" // Added Save icon
import TailleForm from "./TailleForm"
import { useAuth } from "@/app/contexts/AuthContext"

export default function AjouterTailleGroupe() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [genres, setGenres] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [sizes, setSizes] = useState([{
    libelle: "",
    genre_id: "",
    categorie_id: "",
    subcategorie_id: null
  }])

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/categories", {
        withCredentials: true
      })
      setCategories(response.data)
    } catch (error) {
      toast.error("Erreur de chargement des catégories")
      console.error("Error fetching categories:", error)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await axios.get("http://localhost:5000/genres", {
        withCredentials: true
      })
      setGenres(response.data)
    } catch (error) {
      toast.error("Erreur de chargement des genres")
      console.error("Error fetching genres:", error)
    }
  }

  const addSize = () => {
    setSizes([...sizes, {
      libelle: "",
      genre_id: "",
      categorie_id: "",
      subcategorie_id: null
    }])
  }

  const removeSize = (index) => {
    if (sizes.length <= 1) {
      toast.warning("Au moins une taille est requise")
      return
    }
    const newSizes = [...sizes]
    newSizes.splice(index, 1)
    setSizes(newSizes)
  }

  const handleSizeChange = (index, updatedSize) => {
    const newSizes = [...sizes]
    newSizes[index] = updatedSize
    setSizes(newSizes)
  }

  const validateSizes = () => {
    for (const size of sizes) {
      if (!size.libelle.trim()) {
        toast.warning("Nom de taille manquant", {
          description: "Veuillez entrer un nom pour toutes les tailles"
        })
        return false
      }
      
      if (!size.genre_id) {
        toast.warning("Genre manquant", {
          description: "Veuillez sélectionner un genre pour toutes les tailles"
        })
        return false
      }
      
      if (!size.categorie_id && !size.subcategorie_id) {
        toast.warning("Catégorie manquante", {
          description: "Veuillez sélectionner une catégorie ou sous-catégorie pour toutes les tailles"
        })
        return false
      }
    }
    
    return true
  }

  const submitSizes = async (e) => {
    e.preventDefault()
    if (!validateSizes()) return
    
    setLoading(true)
    const toastId = toast.loading("Enregistrement des tailles...")

    try {
      const response = await axios.post(
        'http://localhost:5000/tailles/multiple',
        {
          sizes: sizes.map(size => ({
            libelle: size.libelle.trim(),
            genre_id: size.genre_id,
            categorie_id: size.subcategorie_id || size.categorie_id
          }))
        },
        { withCredentials: true }
      )
      
      if (response.data.success) {
        const successCount = response.data.results.filter(r => r.success).length
        toast.success(`Tailles enregistrées avec succès`, {
          description: `${successCount}/${sizes.length} taille(s) ajoutée(s)`,
          id: toastId
        })
        
        setSizes([{
          libelle: "",
          genre_id: "",
          categorie_id: "",
          subcategorie_id: null
        }])
      } else {
        toast.error("Erreur lors de l'ajout des tailles", {
          description: response.data.message || "Une erreur est survenue",
          id: toastId
        })
      }
    } catch (error) {
      console.error('Erreur API:', error)
      toast.error("Échec de l'ajout des tailles", {
        description: error.response?.data?.message || "Une erreur est survenue",
        id: toastId
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchCategories()
      fetchGenres()
    }
  }, [isAdmin])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des tailles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSizes} className="space-y-4">
            {sizes.map((size, index) => (
              <TailleForm
                key={index}
                index={index}
                size={size}
                categories={categories}
                genres={genres}
                onSizeChange={handleSizeChange}
                onRemove={removeSize}
                showRemoveButton={sizes.length > 1}
                loading={loading}
              />
            ))}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={addSize}
                disabled={loading}
                size={isMobile ? "icon" : "default"}
              >
                <Plus className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Ajouter une taille</span>}
              </Button>

              <Button 
                type="submit" 
                disabled={loading}
                size={isMobile ? "icon" : "default"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {!isMobile && <span className="ml-2">Enregistrer</span>}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}