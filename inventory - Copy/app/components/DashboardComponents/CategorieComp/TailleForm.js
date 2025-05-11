"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TailleForm({
  index,
  size,
  categories,
  genres,
  onSizeChange,
  onRemove,
  showRemoveButton,
  loading
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const parentCategories = useMemo(() => 
    categories.filter(cat => cat.parent_id === null), 
    [categories]
  )

  const subcategories = useMemo(() => {
    if (!size.categorie_id) return []
    return categories.filter(cat => 
      cat.parent_id === parseInt(size.categorie_id))
  }, [size.categorie_id, categories])

  const handleChange = (field, value) => {
    const updatedSize = { ...size }
    
    if (field === 'categorie_id') {
      updatedSize.subcategorie_id = null
    }
    
    updatedSize[field] = value
    onSizeChange(index, updatedSize)
  }

  return (
    <div className="border rounded-lg p-5 space-y-4 relative">
      {showRemoveButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={() => onRemove(index)}
          disabled={loading}
          aria-label="Supprimer la taille"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}

      <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
        <Label htmlFor={`libelle-${index}`} className={isMobile ? '' : 'text-right'}>
          Nom de la taille
        </Label>
        <Input
          id={`libelle-${index}`}
          value={size.libelle}
          onChange={(e) => handleChange('libelle', e.target.value)}
          className={isMobile ? 'w-full' : 'col-span-3'}
          placeholder="Ex: S, M, L, XL, etc."
          required
          disabled={loading}
        />
      </div>

      <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
        <Label htmlFor={`categorie-${index}`} className={isMobile ? '' : 'text-right'}>
          Catégorie
        </Label>
        <Select
          value={size.categorie_id || undefined}
          onValueChange={(value) => handleChange('categorie_id', value)}
          required={!size.subcategorie_id}
          disabled={loading}
        >
          <SelectTrigger className={isMobile ? 'w-full' : 'col-span-3'}>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subcategories.length > 0 && (
        <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
          <Label htmlFor={`subcategorie-${index}`} className={isMobile ? '' : 'text-right'}>
            Sous-catégorie
          </Label>
          <Select
            value={size.subcategorie_id || undefined}
            onValueChange={(value) => handleChange('subcategorie_id', value)}
            disabled={loading}
          >
            <SelectTrigger className={isMobile ? 'w-full' : 'col-span-3'}>
              <SelectValue placeholder="Sélectionner une sous-catégorie (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map(sub => (
                <SelectItem key={sub.id} value={sub.id.toString()}>
                  {sub.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
        <Label htmlFor={`genre-${index}`} className={isMobile ? '' : 'text-right'}>
          Genre
        </Label>
        <Select
          value={size.genre_id || undefined}
          onValueChange={(value) => handleChange('genre_id', value)}
          required
          disabled={loading}
        >
          <SelectTrigger className={isMobile ? 'w-full' : 'col-span-3'}>
            <SelectValue placeholder="Sélectionner un genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map(genre => (
              <SelectItem key={genre.id} value={genre.id.toString()}>
                {genre.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}