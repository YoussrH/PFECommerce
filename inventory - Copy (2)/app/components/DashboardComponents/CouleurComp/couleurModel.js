"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CouleurModal({ open, onOpenChange, onColorAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    libelle: "",
    hexcode: "#ff81c0",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textSuggestions, setTextSuggestions] = useState([]);
  const [extractedColors, setExtractedColors] = useState([]);
  const [textSuggestionsPage, setTextSuggestionsPage] = useState(0);
  const [extractedColorsPage, setExtractedColorsPage] = useState(0);

  const ITEMS_PER_PAGE = 5;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setExtractedColors([]);
      setExtractedColorsPage(0);
    }
  };

  const extractColorFromImage = async () => {
    if (!imageFile) return;
    
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const response = await axios.post(
        "http://localhost:5000/couleurs/extract-from-image", 
        formData, 
        {
          headers: {
            "Authorization": `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (response.data?.length > 0) {
        setExtractedColors(response.data);
        selectExtractedColor(response.data[0]);
      }
    } catch (error) {
      console.error("Error extracting color:", error);
      toast.error("Erreur lors de l'extraction de la couleur");
    }
  };

  const suggestColorFromText = async () => {
    if (!formData.libelle.trim()) return;
    
    try {
      const response = await axios.post(
        "http://localhost:5000/couleurs/suggest/text", 
        { text: formData.libelle },
        {
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
        }
      );
      
      if (response.data?.length > 0) {
        setTextSuggestions(response.data);
        setTextSuggestionsPage(0);
        selectSuggestion(response.data[0]);
      }
    } catch (error) {
      console.error("Error suggesting color:", error);
      toast.error("Erreur lors de la suggestion de couleur");
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData({
      libelle: suggestion.libelle,
      hexcode: suggestion.hexcode,
    });
  };

  const selectExtractedColor = (color) => {
    setFormData({
      libelle: color.libelle,
      hexcode: color.hexcode,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.libelle.trim()) {
      toast.error("Le nom de la couleur est requis");
      return;
    }

    if (!formData.hexcode) {
      toast.error("Le code couleur est requis");
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(
        "http://localhost:5000/couleurs/ajouterCouleur",
        {
          libelle: formData.libelle.trim(),
          hexcode: formData.hexcode,
        },
        {
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
        }
      );

      toast.success("Couleur ajoutée avec succès!");
      onColorAdded(response.data);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error adding color:", error);
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout de la couleur");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      libelle: "",
      hexcode: "#ff81c0",
    });
    setImageFile(null);
    setImagePreview(null);
    setTextSuggestions([]);
    setExtractedColors([]);
    setTextSuggestionsPage(0);
    setExtractedColorsPage(0);
  };

  const nextTextSuggestions = () => {
    if ((textSuggestionsPage + 1) * ITEMS_PER_PAGE < textSuggestions.length) {
      setTextSuggestionsPage(prev => prev + 1);
    }
  };

  const prevTextSuggestions = () => {
    if (textSuggestionsPage > 0) {
      setTextSuggestionsPage(prev => prev - 1);
    }
  };

  const nextExtractedColors = () => {
    if ((extractedColorsPage + 1) * ITEMS_PER_PAGE < extractedColors.length) {
      setExtractedColorsPage(prev => prev + 1);
    }
  };

  const prevExtractedColors = () => {
    if (extractedColorsPage > 0) {
      setExtractedColorsPage(prev => prev - 1);
    }
  };

  const currentTextSuggestions = textSuggestions.slice(
    textSuggestionsPage * ITEMS_PER_PAGE,
    (textSuggestionsPage + 1) * ITEMS_PER_PAGE
  );

  const currentExtractedColors = extractedColors.slice(
    extractedColorsPage * ITEMS_PER_PAGE,
    (extractedColorsPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogTitle className="text-lg font-semibold mb-4">Ajouter une nouvelle couleur</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Name Section */}
          <div className="space-y-4">
            <Label htmlFor="libelle" className="block text-sm font-medium">
              Nom de la couleur *
            </Label>
            <div className="flex gap-2">
              <Input
                id="libelle"
                name="libelle"
                value={formData.libelle}
                onChange={handleChange}
                placeholder="Ex: Rouge vif"
                className="flex-1"
                required
              />
              <Button 
                type="button" 
                variant="secondary"
                onClick={suggestColorFromText}
                disabled={!formData.libelle.trim()}
              >
                Suggérer
              </Button>
            </div>
            
            {/* Text Suggestions */}
            {textSuggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Suggestions basées sur le texte:</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={prevTextSuggestions}
                    disabled={textSuggestionsPage === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {currentTextSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className={`flex flex-col items-center p-2 rounded-md border transition-colors ${
                          formData.hexcode === suggestion.hexcode 
                            ? "border-primary bg-primary/10" 
                            : "border-muted hover:bg-muted/50"
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-full mb-1 border border-muted"
                          style={{ backgroundColor: suggestion.hexcode }}
                        />
                        <span className="text-xs text-center truncate w-full">
                          {suggestion.libelle}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={nextTextSuggestions}
                    disabled={(textSuggestionsPage + 1) * ITEMS_PER_PAGE >= textSuggestions.length}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Color Code Section */}
          <div className="space-y-4">
            <Label htmlFor="hexcode" className="block text-sm font-medium">
              Code couleur *
            </Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded border"
                  style={{ backgroundColor: formData.hexcode }}
                />
              </div>
              <div className="flex-1">
                <Input
                  id="hexcode"
                  name="hexcode"
                  type="text"
                  value={formData.hexcode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === "") {
                      setFormData(prev => ({
                        ...prev,
                        hexcode: value,
                      }));
                    }
                  }}
                  placeholder="#RRGGBB"
                  className="font-mono"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Format hexadécimal (ex: #ff0000)
                </p>
              </div>
            </div>
          </div>
          
          {/* Image Extraction Section */}
          <div className="space-y-4">
            <Label className="block text-sm font-medium">
              Extraire à partir d&apos;une image
            </Label>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={extractColorFromImage}
                  disabled={!imageFile}
                >
                  Extraire les couleurs
                </Button>
              </div>
              
              {imagePreview && (
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-md overflow-hidden border">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {extractedColors.length > 0 && (
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-medium">Couleurs extraites:</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={prevExtractedColors}
                          disabled={extractedColorsPage === 0}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex-1 grid grid-cols-5 gap-2">
                          {currentExtractedColors.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectExtractedColor(color)}
                              className={`flex flex-col items-center p-2 rounded-md border transition-colors ${
                                formData.hexcode === color.hexcode 
                                  ? "border-primary bg-primary/10" 
                                  : "border-muted hover:bg-muted/50"
                              }`}
                            >
                              <div 
                                className="w-8 h-8 rounded-full mb-1 border border-muted"
                                style={{ backgroundColor: color.hexcode }}
                              />
                              <span className="text-xs text-center truncate w-full">
                                {color.libelle}
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={nextExtractedColors}
                          disabled={(extractedColorsPage + 1) * ITEMS_PER_PAGE >= extractedColors.length}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-24"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Ajout...
                </span>
              ) : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}