"use client"
import { useState } from "react"
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

export const CouleurDropdown = ({ couleurs = [], selectedColors = [], setFormData, setCouleurs, formData }) => {
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleCouleurChange = (couleurId, checked) => {
    setFormData((prev) => ({
      ...prev,
      couleurs: checked
        ? [...(prev.couleurs || []), couleurId]
        : (prev.couleurs || []).filter((id) => id !== couleurId),
      images_par_couleur: checked
        ? {
            ...prev.images_par_couleur,
            [couleurId]: prev.images_par_couleur[couleurId] || [],
          }
        : Object.fromEntries(Object.entries(prev.images_par_couleur).filter(([id]) => id !== couleurId.toString())),
    }))
  }

  const handleColorAdded = (newColor) => {
    setCouleurs((prev) => [...prev, newColor])
    setFormData((prev) => ({
      ...prev,
      couleurs: [...(prev.couleurs || []), newColor.id],
      images_par_couleur: {
        ...prev.images_par_couleur,
        [newColor.id]: [],
      },
    }))
  }

  const openImageModal = (couleurId) => {
    const couleur = couleurs.find((c) => c.id === couleurId)
    setSelectedColor(couleur)
    setIsImageModalOpen(true)
  }

  const handleFileUpload = (files) => {
    if (!selectedColor) return

    setFormData((prev) => ({
      ...prev,
      images_par_couleur: {
        ...prev.images_par_couleur,
        [selectedColor.id]: [...(prev.images_par_couleur[selectedColor.id] || []), ...files],
      },
    }))
  }

  const removeImage = (index) => {
    if (!selectedColor) return

    setFormData((prev) => {
      const newImages = [...prev.images_par_couleur[selectedColor.id]]
      newImages.splice(index, 1)

      return {
        ...prev,
        images_par_couleur: {
          ...prev.images_par_couleur,
          [selectedColor.id]: newImages,
        },
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Custom dropdown implementation */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>
              {selectedColors.length > 0
                ? `${selectedColors.length} couleur(s) sélectionnée(s)`
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
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 px-4 py-2 border-b bg-white">
                <h3 className="text-xs font-medium text-gray-700">Couleurs disponibles</h3>
              </div>

              <div className="p-1">
                {couleurs.map((couleur) => (
                  <div
                    key={couleur.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        id={`couleur-${couleur.id}`}
                        checked={selectedColors.includes(couleur.id)}
                        onChange={(e) => handleCouleurChange(couleur.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span
                        className="w-4 h-4 rounded-full inline-block border border-gray-300"
                        style={{ backgroundColor: couleur.hexcode || "#ccc" }}
                      />
                      <label htmlFor={`couleur-${couleur.id}`} className="text-xs cursor-pointer">
                        {couleur.libelle}
                      </label>
                    </div>

                    {selectedColors.includes(couleur.id) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openImageModal(couleur.id)
                        }}
                        className="p-1 rounded-full hover:bg-gray-200"
                        title="Ajouter des images"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
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
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display selected colors with badges */}
      {selectedColors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedColors.map((colorId) => {
            const color = couleurs.find((c) => c.id === colorId)
            if (!color) return null

            return (
              <div key={colorId} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: color.hexcode || "#ccc" }}
                />
                <span>{color.libelle}</span>
                <button
                  type="button"
                  onClick={() => handleCouleurChange(colorId, false)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => openImageModal(colorId)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <ImageIcon className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <CouleurModal open={isColorModalOpen} onOpenChange={setIsColorModalOpen} onColorAdded={handleColorAdded} />

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xs">Images pour {selectedColor?.libelle}</DialogTitle>
            <DialogDescription className="text-xs">Ajoutez des images pour cette couleur</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <Dropzone onDrop={handleFileUpload} accept="image/*" />

            <div className="flex gap-2 flex-wrap text-xs">
              {((selectedColor && formData.images_par_couleur[selectedColor.id]) || []).map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt={`Preview ${index}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setIsImageModalOpen(false)} className="mt-4 text-xs">
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
