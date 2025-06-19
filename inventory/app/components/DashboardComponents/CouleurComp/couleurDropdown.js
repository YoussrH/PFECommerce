"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ImageIcon, X } from "lucide-react"
import { CouleurModal } from "./couleurModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Dropzone } from "@/components/ui/dropzone"

export const CouleurDropdown = ({ 
  couleurs = [], 
  setFormData, 
  formData,
  existingImages = {},
  setExistingImages
}) => {
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Get current selections from formData
  const currentSelectedColors = [...new Set(formData.variations.map(v => v.couleur_id))]

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCouleurChange = (couleurId, checked) => {
    setFormData(prev => {
      const newVariations = checked
        ? [...prev.variations, { couleur_id: couleurId, taille_id: 0, quantite: 0 }]
        : prev.variations.filter(v => v.couleur_id !== couleurId)

      const newImages = { ...prev.images_par_couleur }
      if (checked && !newImages[couleurId]) {
        newImages[couleurId] = []
      } else if (!checked) {
        delete newImages[couleurId]
      }

      return {
        ...prev,
        variations: newVariations,
        images_par_couleur: newImages
      }
    })
  }

  const toggleDropdown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDropdownOpen(prev => !prev)
  }

  const handleColorSelect = (couleurId) => {
    const isSelected = currentSelectedColors.includes(couleurId)
    handleCouleurChange(couleurId, !isSelected)
  }

  const handleImageClick = (e, couleurId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedColor(couleurs.find(c => c.id === couleurId))
    setIsImageModalOpen(true)
    setDropdownOpen(false)
  }

  const handleAddColor = (newColor) => {
    setFormData(prev => ({
      ...prev,
      images_par_couleur: {
        ...prev.images_par_couleur,
        [newColor.id]: []
      }
    }))
    setIsColorModalOpen(false)
  }

  const handleFileUpload = (files) => {
    if (!selectedColor) return

    setFormData(prev => ({
      ...prev,
      images_par_couleur: {
        ...prev.images_par_couleur,
        [selectedColor.id]: [...(prev.images_par_couleur[selectedColor.id] || []), ...files]
      }
    }))
  }

  const removeImage = (index) => {
    if (!selectedColor) return

    setFormData(prev => {
      const newImages = [...prev.images_par_couleur[selectedColor.id]]
      newImages.splice(index, 1)

      return {
        ...prev,
        images_par_couleur: {
          ...prev.images_par_couleur,
          [selectedColor.id]: newImages
        }
      }
    })
  }

  const removeExistingImage = (index) => {
    if (!selectedColor) return

    setExistingImages(prev => {
      const newImages = { ...prev }
      if (newImages[selectedColor.id]) {
        newImages[selectedColor.id].splice(index, 1)
        if (newImages[selectedColor.id].length === 0) {
          delete newImages[selectedColor.id]
        }
      }
      return newImages
    })
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={toggleDropdown}
            className="w-full flex justify-between items-center px-4 py-2 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span>
              {currentSelectedColors.length > 0
                ? `${currentSelectedColors.length} couleur(s) sélectionnée(s)`
                : "Sélectionner les couleurs"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div 
              className="absolute z-[1000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
            >
              <div className="sticky top-0 px-4 py-2 border-b bg-white">
                <h3 className="text-xs font-medium text-gray-700">Couleurs disponibles</h3>
              </div>

              <div className="p-1">
                {couleurs.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">Aucune couleur disponible</div>
                ) : (
                  couleurs.map(couleur => {
                    const isSelected = currentSelectedColors.includes(couleur.id)

                    return (
                      <div
                        key={couleur.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleColorSelect(couleur.id)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="checkbox"
                            id={`couleur-${couleur.id}`}
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleColorSelect(couleur.id)
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span
                            className="w-4 h-4 rounded-full inline-block border border-gray-300"
                            style={{ backgroundColor: couleur.hexcode || "#ccc" }}
                          />
                          <label 
                            htmlFor={`couleur-${couleur.id}`} 
                            className="text-xs cursor-pointer"
                          >
                            {couleur.libelle}
                          </label>
                        </div>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => handleImageClick(e, couleur.id)}
                            className="p-1 rounded-full hover:bg-gray-200"
                            title="Ajouter des images"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsColorModalOpen(true)}
          className="h-10 w-10"
          title="Ajouter une nouvelle couleur"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected colors display */}
      {currentSelectedColors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentSelectedColors.map(colorId => {
            const color = couleurs.find(c => c.id === colorId)
            if (!color) return null

            return (
              <div 
                key={colorId} 
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span
                  className="w-3 h-3 rounded-full inline-block border border-gray-300"
                  style={{ backgroundColor: color.hexcode || "#ccc" }}
                />
                <span>{color.libelle}</span>
                <button
                  type="button"
                  onClick={() => handleCouleurChange(colorId, false)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  title="Supprimer la couleur"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleImageClick(e, colorId)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  title="Ajouter des images"
                >
                  <ImageIcon className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Color modal */}
      <CouleurModal 
        open={isColorModalOpen} 
        onOpenChange={setIsColorModalOpen} 
        onColorAdded={handleAddColor} 
      />

      {/* Image modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xs">
              Images pour {selectedColor?.libelle || 'couleur inconnue'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gérer les images pour cette couleur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Dropzone 
              onDrop={handleFileUpload} 
              accept="image/*"
              maxFiles={10}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {/* Existing images */}
              {selectedColor && existingImages[selectedColor.id]?.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Existing ${index}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer l'image"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    Existante
                  </div>
                </div>
              ))}

              {/* Newly uploaded images */}
              {selectedColor && formData.images_par_couleur[selectedColor.id]?.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer l'image"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-50 text-white text-xs p-1 text-center">
                    Nouvelle
                  </div>
                </div>
              ))}
            </div>

            {selectedColor && 
              (!existingImages[selectedColor.id] || existingImages[selectedColor.id].length === 0) && 
              (!formData.images_par_couleur[selectedColor.id] || formData.images_par_couleur[selectedColor.id].length === 0) && (
              <div className="text-center py-4 text-xs text-gray-500">
                Aucune image pour cette couleur
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsImageModalOpen(false)}
              className="mt-4"
            >
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}