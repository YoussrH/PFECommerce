"use client";
import React, { useState } from "react";
import Image from "next/image";
import { GoHeart } from "react-icons/go";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { AiOutlinePlus } from "react-icons/ai";
import ProductDetailsModel from "../productsModel/[id]/page";

const GarconProductList = ({ products = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [produitAchatRapide, setProduitAchatRapide] = useState(null);
  const productsPerPage = 12;

  // Get primary image for a product
  const getPrimaryImage = (product) => {
    if (!product) return '/placeholder-image.jpg';
    
    // Check for images_couleurs first
    if (product.images_couleurs?.length > 0) {
      return product.images_couleurs[0].image_url;
    }
    
    // Check for images_par_couleur
    if (product.images_par_couleur) {
      const firstColor = Object.keys(product.images_par_couleur)[0];
      return product.images_par_couleur[firstColor]?.[0];
    }
    
    // Fallback to images array if exists
    if (product.images?.length > 0) {
      return Array.isArray(product.images) 
        ? product.images[0] 
        : product.images;
    }
    
    return '/placeholder-image.jpg';
  };

  // Calculate total stock from sizes
  const calculateTotalStock = (sizes) => {
    if (!sizes) return 0;
    return sizes.reduce((sum, size) => {
      return sum + (size.ArticleTaille?.quantite || 0);
    }, 0);
  };

  const filteredProducts = products.filter((product) =>
    product.nom_produit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Prepare product data for modal
  const preparerProduitPourModal = (product) => {
    if (!product) return null;
    
    // Extract available sizes with quantities
    const taillesDisponibles = product.tailles
      ?.filter(t => t.ArticleTaille?.quantite > 0)
      .map(t => ({
        id: t.id,
        nom: t.libelle,
        quantite: t.ArticleTaille.quantite,
        couleur_id: t.ArticleTaille.couleur_id
      })) || [];

    // Get all color options
    const couleursDisponibles = product.couleurs?.map(c => ({
      id: c.id,
      nom: c.libelle,
      hexcode: c.hexcode
    })) || [];

    // Get images organized by color
    const imagesParCouleur = {};
    if (product.images_couleurs) {
      product.images_couleurs.forEach(img => {
        if (!imagesParCouleur[img.couleur_id]) {
          imagesParCouleur[img.couleur_id] = [];
        }
        imagesParCouleur[img.couleur_id].push(img.image_url);
      });
    } else if (product.images_par_couleur) {
      Object.assign(imagesParCouleur, product.images_par_couleur);
    }

    return {
      ...product,
      marque: product.marque?.libelle || product.marque,
      tailles: taillesDisponibles,
      couleurs: couleursDisponibles,
      images_par_couleur: imagesParCouleur,
      stock: product.stock || calculateTotalStock(product.tailles),
      primaryImage: getPrimaryImage(product)
    };
  };

  const handleClicAchatRapide = (product) => {
    if (!product?.id) {
      toast.error("Données produit invalides");
      return;
    }
    setProduitAchatRapide(preparerProduitPourModal(product));
  };

  const handleAjoutPanier = async ({ product, selectedSize, quantity, selectedColor }) => {
    try {
      if (!product?.id || !selectedSize?.id || !selectedColor?.id) {
        throw new Error("Produit, taille ou couleur invalide");
      }

      const response = await axios.post(
        "http://localhost:5000/panier/ajouterAuPanier",
        {
          articles: [{
            article_id: product.id,
            quantite: quantity,
            taille_id: selectedSize.id,
            couleur_id: selectedColor.id,
            prix_au_moment_ajout: product.prix_final || product.prix
          }]
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Produit ajouté au panier avec succès");
        return true;
      } else {
        toast.error(response.data.message || "Erreur lors de l'ajout au panier");
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout au panier");
      return false;
    }
  };

  const handleAchatRapide = async ({ product, selectedSize, selectedColor }) => {
    const ajoute = await handleAjoutPanier({
      product,
      selectedSize,
      selectedColor,
      quantity: 1
    });
    
    if (ajoute) {
      window.location.href = '/caisse';
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full px-4 sm:w-4/5 lg:w-2/3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => {
              const primaryImage = getPrimaryImage(product);
              const stock = product.stock || calculateTotalStock(product.tailles);
              const marque = product.marque?.libelle || product.marque;

              return (
                <div key={product.id} className="relative group transition-all duration-300">
                  <Link href={`/store/products/${product.id}`}>
                    <div className="aspect-square relative">
                      <Image
                        src={primaryImage}
                        alt={product.nom_produit || "Image du produit"}
                        fill
                        className="object-contain rounded-sm my-5 cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  </Link>

                  <div className="-ml-5 justify-center">
                    <div className="w-full flex justify-center mt-2">
                      <div className="animate-bounce text-center border border-green-500 text-green-500 bg-white rounded-lg text-[10px] font-serif px-2 py-1">
                        <span>GARÇON</span>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <p className="text-gray-700 text-sm mt-2">
                        {marque || "Marque inconnue"}
                      </p>

                      <div className="group-hover:opacity-0 transition-opacity duration-300">
                        <p className="text-gray-700 font-serif text-xs mt-2">
                          {product.nom_produit || "Produit sans nom"}
                        </p>
                        <p className="text-green-500 font-serif text-xs font-semibold">
                          {product.prix_final || product.prix || 0} €
                          {product.remise > 0 && (
                            <span className="text-gray-400 line-through ml-2">
                              {product.prix} €
                            </span>
                          )}
                        </p>
                        {stock <= 0 && (
                          <p className="text-red-500 text-xs mt-1">Rupture de stock</p>
                        )}
                      </div>
                    </div>

                    {stock > 0 && (
                      <div className="-mt-10 relative inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleClicAchatRapide(product);
                            }}
                            className="bg-green-500 border border-green-500 text-white font-serif text-xs px-4 py-2 rounded-full flex items-center hover:bg-white hover:text-green-500 transition-all duration-300"
                          >
                            Achat Rapide
                          </button>
                          <GoHeart className="w-5 h-5 cursor-pointer mt-2 text-green-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 col-span-4 text-center">Aucun produit ne correspond à vos filtres.</p>
          )}
        </div>

        <div className="flex justify-center items-center my-11 space-x-4">
          <div className="flex justify-center mt-4">
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-green-500 text-white font-serif text-xs px-4 py-2 rounded-full hover:bg-white hover:border hover:border-green-500 hover:text-green-500 transition-all duration-300"
            >
              Voir la Page Suivante
            </button>
          </div>
          <div className="flex gap-3 font-mono mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="text-gray-700 hover:text-black disabled:text-gray-300"
            >
              &lt;
            </button>

            {totalPages > 5 ? (
              <>
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-xs font-serif ${
                      currentPage === page
                        ? "border border-green-500 bg-white text-green-500"
                        : "text-gray-700 hover:text-green-500"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <span>...</span>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`px-3 py-1 text-xs font-serif ${
                    currentPage === totalPages
                      ? "border border-green-500 bg-white text-green-500"
                      : "text-gray-700 hover:text-green-500"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            ) : (
              Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-xs font-serif ${
                      currentPage === page
                        ? "border border-green-500 bg-white text-green-500"
                        : "text-gray-700 hover:text-green-500"
                    }`}
                  >
                    {page}
                  </button>
                );
              })
            )}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="text-gray-700 hover:text-black disabled:text-gray-300"
            >
              &gt;
            </button>
          </div>
        </div>

        {produitAchatRapide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ProductDetailsModel
                product={produitAchatRapide}
                onAddToCart={handleAjoutPanier}
                onQuickBuy={handleAchatRapide}
                customButtons={({ product, selectedSize, selectedColor, isAddingToCart }) => (
                  <>
                    <button
                      className={`bg-green-500 text-white px-4 py-2 flex items-center gap-1 text-sm w-full lg:w-auto ${
                        (!selectedSize || !selectedColor || product.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={async () => {
                        const ajoute = await handleAjoutPanier({
                          product,
                          selectedSize,
                          selectedColor,
                          quantity: 1
                        });
                        if (ajoute) {
                          setProduitAchatRapide(null);
                        }
                      }}
                      disabled={!selectedSize || !selectedColor || product.stock <= 0 || isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <>
                          <AiOutlinePlus size={12} />
                          Ajouter au panier
                        </>
                      )}
                    </button>
                    <button
                      className={`bg-green-600 text-white px-4 py-2 text-sm w-full lg:w-auto ${
                        (!selectedSize || !selectedColor || product.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={async () => {
                        await handleAchatRapide({ 
                          product, 
                          selectedSize,
                          selectedColor
                        });
                      }}
                      disabled={!selectedSize || !selectedColor || product.stock <= 0 || isAddingToCart}
                    >
                      Achetez maintenant
                    </button>
                  </>
                )}
              />
              <button
                className="absolute top-4 right-4 text-white text-2xl"
                onClick={() => setProduitAchatRapide(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarconProductList;