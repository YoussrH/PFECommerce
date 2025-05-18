"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ArrowUpDown, MoreHorizontal, Edit, Trash, ChevronDown, Search } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import EditModal from "./EditModal"
import { toast } from "sonner"
import { useArticle } from "@/hooks/useArticle"

export default function ProductTable() {
  const {
    articles,
    loading,
    fetchAllArticles,
    fetchArticleById,
    updateArticle,
    deleteArticle,
    fetchArticlesCount
  } = useArticle()

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [articleCount, setArticleCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      await fetchAllArticles()
      const count = await fetchArticlesCount()
      setArticleCount(count)
    }
    loadData()
  }, [fetchAllArticles, fetchArticlesCount])

  const handleEdit = async (product) => {
    try {
      const fullProduct = await fetchArticleById(product.id)
      setSelectedProduct(fullProduct)
      setIsEditModalOpen(true)
    } catch (error) {
      toast.error("Failed to load product details")
    }
  }

  const handleSave = async (updatedProduct) => {
    try {
      const result = await updateArticle(updatedProduct.id, updatedProduct)
      if (result) {
        toast.success("Product updated successfully")
        fetchAllArticles()
      }
    } catch (error) {
      toast.error("Failed to update product")
    }
    setIsEditModalOpen(false)
  }

  const handleDelete = async (id) => {
    try {
      const success = await deleteArticle(id)
      if (success) {
        toast.success("Product deleted successfully")
        fetchAllArticles()
      }
    } catch (error) {
      toast.error("Failed to delete product")
    }
  }

  const columns = [
    {
      accessorKey: "primaryImage",
      header: "Image",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.original.primaryImage ? (
            <Image
              src={row.original.primaryImage}
              alt={row.original.nom_produit}
              width={40}
              height={40}
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "nom_produit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="whitespace-nowrap"
        >
          Nom
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.nom_produit}</div>,
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <div className="text-sm">{row.original.sku}</div>,
    },
    {
      accessorKey: "prix",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Prix
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {row.original.prix ? Number(row.original.prix).toFixed(3) + " DT" : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.original.stock || 0}</div>,
    },
    {
      accessorKey: "genre.libelle",
      header: "Genre",
      cell: ({ row }) => <div>{row.original.genre?.libelle || "N/A"}</div>,
    },
    {
      accessorKey: "categorie.libelle",
      header: "Catégorie",
      cell: ({ row }) => <div>{row.original.categorie?.libelle || "N/A"}</div>,
    },
    {
      accessorKey: "marque.libelle",
      header: "Marque",
      cell: ({ row }) => <div>{row.original.marque?.libelle || "N/A"}</div>,
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
            {row.original.couleurs?.map((couleur) => (
              <DropdownMenuItem key={couleur.id} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: couleur.hexcode || "#ccc" }} />
                {couleur.libelle}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "tailles_par_couleur",
      header: "Tailles",
      cell: ({ row }) => {
        const tailles = row.original.tailles_par_couleur || {}
        const totalSizes = Object.values(tailles).reduce((acc, colorData) => acc + (colorData.tailles?.length || 0), 0)
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 p-0">
                Voir tailles ({totalSizes})
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Tailles disponibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(tailles).map(([colorId, colorData]) => {
                const color = row.original.couleurs?.find(c => c.id === parseInt(colorId)) || {}
                return (
                  <div key={colorId}>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hexcode || "#ccc" }} />
                      {color.libelle || "Couleur inconnue"}
                    </DropdownMenuLabel>
                    {colorData.tailles?.map((size) => (
                      <DropdownMenuItem key={`${colorId}-${size.id}`}>
                        {size.libelle} - {size.quantite} unités
                      </DropdownMenuItem>
                    ))}
                  </div>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(product)}>
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600 focus:text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]

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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrer les articles..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Colonnes <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === "nom_produit"
                    ? "Nom"
                    : column.id === "genre.libelle"
                      ? "Genre"
                      : column.id === "categorie.libelle"
                        ? "Catégorie"
                        : column.id === "marque.libelle"
                          ? "Marque"
                          : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Chargement en cours...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className=" text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length}/{articleCount} au total
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={table.getState().pagination.pageIndex === page - 1}
                  onClick={() => table.setPageIndex(page - 1)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {isEditModalOpen && selectedProduct && (
        <EditModal
          article={selectedProduct}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleSave}
        />
      )}
    </div>
  )
}