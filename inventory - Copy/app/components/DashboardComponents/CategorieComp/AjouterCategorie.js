// AjouterCategorie.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import { ChevronRight, ChevronDown } from 'lucide-react';

const renderCategories = (categories, level = 0) => {
  return categories.map(category => (
    <TreeItem 
      key={category.id} 
      nodeId={category.id.toString()}
      label={category.libelle}
      sx={{ 
        paddingLeft: `${level * 20}px`,
        '& .MuiTreeItem-content': {
          padding: '4px 8px',
        }
      }}
    >
      {category.sous_categories && category.sous_categories.length > 0 && 
        renderCategories(category.sous_categories, level + 1)}
    </TreeItem>
  ));
};

export default function AjouterCategorie() {
  const [formData, setFormData] = useState({
    libelle: '',
    parent_id: null,
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const response = await axios.get('http://localhost:5000/categories/hierarchie');
        setCategories(response.data);
      } catch (error) {
        toast.error("Erreur lors du chargement des catégories");
        console.error("Fetch error:", error);
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleParentSelect = (nodeId) => {
    setSelectedParent(nodeId);
    setFormData(prev => ({ ...prev, parent_id: nodeId === "null" ? null : parseInt(nodeId) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.libelle) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/categories/ajouterCategorie', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Catégorie ajoutée avec succès!');
      setFormData({ libelle: '', parent_id: null });
      setSelectedParent(null);
      
      // Refresh categories list
      const response = await axios.get('http://localhost:5000/categories/hierarchie');
      setCategories(response.data);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion des Catégories</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Category Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ajouter une catégorie</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="libelle">Nom de la catégorie *</Label>
              <Input 
                type="text" 
                id="libelle"
                name="libelle" 
                value={formData.libelle} 
                onChange={handleChange} 
                required 
                placeholder="Entrez le nom de la catégorie"
              />
            </div>
            
            <div>
              <Label>Catégorie parente</Label>
              <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                <TreeView
                  aria-label="category tree"
                  defaultCollapseIcon={<ChevronDown size={16} />}
                  defaultExpandIcon={<ChevronRight size={16} />}
                  selected={selectedParent || "null"}
                  onNodeSelect={(e, nodeId) => handleParentSelect(nodeId)}
                >
                  <TreeItem nodeId="null" label="Catégorie principale" />
                  {renderCategories(categories)}
                </TreeView>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || fetchingCategories}
              >
                {loading ? 'En cours...' : 'Ajouter la catégorie'}
              </Button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Structure des catégories</h2>
          {fetchingCategories ? (
            <p>Chargement...</p>
          ) : (
            <div className="border rounded-md p-2">
              <TreeView
                aria-label="category structure"
                defaultCollapseIcon={<ChevronDown size={16} />}
                defaultExpandIcon={<ChevronRight size={16} />}
              >
                {categories.length === 0 ? (
                  <p className="text-gray-500 p-2">Aucune catégorie existante</p>
                ) : (
                  renderCategories(categories)
                )}
              </TreeView>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}