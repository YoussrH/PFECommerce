"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

const CategoryForm = ({ initialValues, onSubmit, onCancel }) => {
  const { token } = useAuth();
  const [libelle, setLibelle] = useState(initialValues?.libelle || "");
  const [isSubcategory, setIsSubcategory] = useState(!!initialValues?.parent_id);
  const [parentId, setParentId] = useState(initialValues?.parent_id || null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (initialValues) {
      setLibelle(initialValues.libelle);
      setIsSubcategory(!!initialValues.parent_id);
      setParentId(initialValues.parent_id || null);
    }
  }, [initialValues]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await axios.get("http://localhost:5000/categories", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        toast.error("Erreur lors du chargement des catégories");
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!libelle.trim()) {
        throw new Error("Le nom de la catégorie ne peut pas être vide");
      }
  
      const formData = {
        libelle,
        parent_id: isSubcategory ? parentId : null
      };
  
      await onSubmit(formData);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter(category => !category.parent_id);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
      {/* Name Field */}
      <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
        <Label htmlFor="libelle" className={isMobile ? '' : 'text-right'}>
          Nom
        </Label>
        <Input
          id="libelle"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className={isMobile ? 'w-full' : 'col-span-3'}
          placeholder="Entrez le nom de la catégorie"
          required
        />
      </div>

      {/* Category Type */}
      <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
        <Label className={isMobile ? '' : 'text-right'}>Type</Label>
        <div className={`${isMobile ? 'space-y-2' : 'col-span-3 flex items-center space-x-4'}`}>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="parent"
              checked={!isSubcategory}
              onChange={() => {
                setIsSubcategory(false);
                setParentId(null);
              }}
              className="h-4 w-4 text-primary"
            />
            <Label htmlFor="parent">Catégorie principale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="subcategory"
              checked={isSubcategory}
              onChange={() => setIsSubcategory(true)}
              className="h-4 w-4 text-primary"
            />
            <Label htmlFor="subcategory">Sous-catégorie</Label>
          </div>
        </div>
      </div>

      {/* Parent Category Selector */}
      {isSubcategory && (
        <div className={`${isMobile ? 'space-y-2' : 'grid grid-cols-4 items-center gap-4'}`}>
          <Label htmlFor="parentCategory" className={isMobile ? '' : 'text-right'}>
            Catégorie parente
          </Label>
          <Select 
            value={parentId ? parentId.toString() : undefined}
            onValueChange={(value) => setParentId(value ? parseInt(value) : null)}
            required={isSubcategory}
            disabled={categoriesLoading}
          >
            <SelectTrigger className={isMobile ? 'w-full' : 'col-span-3'}>
              <SelectValue placeholder="Sélectionnez une catégorie parente" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.libelle}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          type="button" 
          onClick={onCancel}
          disabled={loading}
          size={isMobile ? "icon" : "default"}
        >
          {isMobile ? "✕" : "Annuler"}
        </Button>
        <Button 
          type="submit" 
          disabled={loading || categoriesLoading}
          size={isMobile ? "icon" : "default"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isMobile ? (
            "✓"
          ) : initialValues ? (
            "Modifier"
          ) : (
            "Ajouter"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;