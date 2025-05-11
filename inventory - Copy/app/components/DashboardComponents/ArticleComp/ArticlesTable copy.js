"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash, ChevronDown } from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import EditArticleModal from "./EditArticleModal";
import Image from "next/image";

const ArticlesTable = () => {
  const [articles, setArticles] = useState([]);
  const [allData, setAllData] = useState({
    marques: [],
    genres: [],
    categories: [],
    tailles: [],
    couleurs: []
  });
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, marquesRes, genresRes, categoriesRes, taillesRes, couleursRes] = await Promise.all([
          axios.get("http://localhost:5000/articles", { withCredentials: true }),
          axios.get("http://localhost:5000/marques", { withCredentials: true }),
          axios.get("http://localhost:5000/genres", { withCredentials: true }),
          axios.get("http://localhost:5000/categories", { withCredentials: true }),
          axios.get("http://localhost:5000/tailles", { withCredentials: true }),
          axios.get("http://localhost:5000/couleurs", { withCredentials: true }),
        ]);

        const transformedArticles = articlesRes.data.donnees.map(article => {
          // Calculate total stock
          const totalStock = article.tailles?.reduce((sum, taille) => {
            return sum + (taille.ArticleTaille?.quantite || 0);
          }, 0) || 0;

          return {
            ...article,
            stock: totalStock,
            tailles: article.tailles?.map(taille => ({
              id: taille.id,
              taille_id: taille.id, // Add taille_id for consistency
              libelle: taille.libelle,
              quantite: taille.ArticleTaille?.quantite || 0,
              genre_id: taille.genre_id,
              categorie_id: taille.categorie_id
            })) || [],
            couleurs: article.couleurs?.map(couleur => ({
              id: couleur.id,
              libelle: couleur.libelle,
              hexcode: couleur.hexcode
            })) || []
          };
        });

        setArticles(transformedArticles);
        setAllData({
          marques: marquesRes.data.donnees || [],
          genres: genresRes.data.donnees || [],
          categories: categoriesRes.data.donnees || [],
          tailles: taillesRes.data.donnees || [],
          couleurs: couleursRes.data.donnees || []
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Échec du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = async (article) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:5000/articles/obtenirArticleParId/${article.id}`,
        { withCredentials: true },
      );    
          console.log("Full article data from API:", response.data.donnees);

      
      const fullArticle = response.data.donnees;
      
      // Transform the article data for the modal
      const transformedArticle = {
        ...fullArticle,
        tailles: fullArticle.tailles?.map(t => ({
          id: t.id,
          taille_id: t.id, // Make sure to include taille_id
          libelle: t.libelle,
          quantite: t.ArticleTaille?.quantite || 0,
          genre_id: t.genre_id,
          categorie_id: t.categorie_id
        })) || [],
        couleurs: fullArticle.couleurs?.map(c => ({
          id: c.id,
          libelle: c.libelle,
          hexcode: c.hexcode
        })) || [],
        // These are needed for the form state:
        selectedCouleurs: fullArticle.couleurs?.map(c => c.id.toString()) || [],
        selectedTailles: fullArticle.tailles?.map(t => t.id.toString()) || [],
        tailles_quantites: fullArticle.tailles?.reduce((acc, taille) => {
          acc[taille.id] = taille.ArticleTaille?.quantite || 0;
          return acc;
        }, {}) || {},
        existingImages: fullArticle.images || []
      };
  
      setSelectedArticle(transformedArticle);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching article details:", error);
      toast.error("Échec du chargement des détails de l'article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedArticle) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/articles/mettreAJourArticle/${updatedArticle.id}`,
        updatedArticle,
        { withCredentials: true }
      );
      
      const updatedArticleData = response.data.donnees;
      
      // Calculate total stock for the updated article
      const totalStock = updatedArticleData.tailles?.reduce((sum, taille) => {
        return sum + (taille.ArticleTaille?.quantite || 0);
      }, 0) || 0;

      // Update the articles state
      setArticles(prevArticles => 
        prevArticles.map(article => 
          article.id === updatedArticle.id ? {
            ...updatedArticleData,
            stock: totalStock,
            tailles: updatedArticleData.tailles?.map(taille => ({
              id: taille.id,
              taille_id: taille.id,
              libelle: taille.libelle,
              quantite: taille.ArticleTaille?.quantite || 0,
              genre_id: taille.genre_id,
              categorie_id: taille.categorie_id
            })) || [],
            couleurs: updatedArticleData.couleurs?.map(couleur => ({
              id: couleur.id,
              libelle: couleur.libelle,
              hexcode: couleur.hexcode
            })) || []
          } : article
        )
      );
      
      toast.success("Article mis à jour avec succès");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Échec de la mise à jour de l'article");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/articles/supprimerArticle/${id}`, { withCredentials: true });
      setArticles(prev => prev.filter(article => article.id !== id));
      toast.success("Article supprimé avec succès");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Échec de la suppression de l'article");
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "images",
      header: "Image",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.images?.length > 0 ? (
            <Image
              src={row.original.images[0]}
              alt="Preview"
              width={40}
              height={40}
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "nom_produit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.nom_produit}</div>,
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <div>{row.original.sku}</div>,
    },
    {
      accessorKey: "prix",
      header: "Prix",
      cell: ({ row }) => <div>{row.original.prix} DT</div>,
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => <div>{row.getValue("stock")}</div>,
    },
    {
      accessorKey: "genre",
      header: "Genre",
      cell: ({ row }) => <div>{row.original.genre?.libelle || "N/A"}</div>,
    },
    {
      accessorKey: "categorie",
      header: "Catégorie",
      cell: ({ row }) => <div>{row.original.categorie?.libelle || "N/A"}</div>,
    },
    {
      accessorKey: "marque",
      header: "Marque",
      cell: ({ row }) => <div>{row.original.marque?.libelle || "N/A"}</div>,
    },
    {
      accessorKey: "tailles",
      header: "Tailles",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 p-0">
              Voir tailles ({row.original.tailles?.length || 0})
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Tailles disponibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {row.original.tailles?.map(taille => (
              <DropdownMenuItem key={taille.id}>
                {taille.libelle} - Quantité: {taille.quantite || taille.ArticleTaille?.quantite || 0}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      accessorKey: "couleurs",
      header: "Couleurs",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 p-0">
              Voir couleurs ({row.original.couleurs?.length || 0})
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Couleurs disponibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {row.original.couleurs?.map(couleur => (
              <DropdownMenuItem key={couleur.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: couleur.hexcode || '#ccc' }}
                />
                {couleur.libelle}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const article = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-sans">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(article)}>
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(article.id)}>
                <Trash className="mr-2 h-4 w-4 text-red-700" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: articles,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="p-6 rounded-lg font-sans">
      <Toaster position="top-right" />
      <h2 className="text-xl font-normal mb-4">Tous les articles</h2>
  
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Chargement en cours...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrer les articles..."
              value={table.getColumn("nom_produit")?.getFilterValue() ?? ""}
              onChange={(event) => table.getColumn("nom_produit")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Colonnes <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
  
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      Aucun résultat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
  
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}
  
      {isEditModalOpen && selectedArticle && (
        <EditArticleModal
        article={selectedArticle}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        allData={allData}
      />
      )}
    </div>
  );
};

export default ArticlesTable;