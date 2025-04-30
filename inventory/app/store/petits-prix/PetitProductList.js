"use client";
import React, { useState } from "react";
import Image from "next/image";
import { GoHeart } from "react-icons/go";
import Pagination from "@mui/material/Pagination";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { AiOutlinePlus } from "react-icons/ai";
import ProductDetailsModel from "../productsModel/[id]/page";

const PetitProductList = ({ produits = [] }) => {
  const [recherche, setRecherche] = useState("");
  const [pageCourante, setPageCourante] = useState(1);
  const [produitAchatRapide, setProduitAchatRapide] = useState(null);
  const produitsParPage = 12;

  const produitsFiltres = produits.filter((produit) =>
    produit.nom_produit?.toLowerCase().includes(recherche.toLowerCase())
  );

  const indexDernierProduit = pageCourante * produitsParPage;
  const indexPremierProduit = indexDernierProduit - produitsParPage;
  const produitsCourants = produitsFiltres.slice(
    indexPremierProduit,
    indexDernierProduit
  );

  const totalPages = Math.ceil(produitsFiltres.length / produitsParPage);

  const handleChangementPage = (event, valeur) => {
    setPageCourante(valeur);
  };

  // Helper to get primary image URL
  const getPrimaryImage = (produit) => {
    if (produit.images_couleurs?.length > 0) {
      return produit.images_couleurs[0].image_url;
    }
    if (produit.images_par_couleur) {
      const firstColor = Object.keys(produit.images_par_couleur)[0];
      return produit.images_par_couleur[firstColor]?.[0];
    }
    return "/placeholder-image.jpg";
  };

  // Calculate total stock from sizes
  const calculateTotalStock = (tailles) => {
    if (!tailles) return 0;
    return tailles.reduce((sum, taille) => {
      return sum + (taille.ArticleTaille?.quantite || 0);
    }, 0);
  };

  // Prepare product data for modal
  const preparerProduitPourModal = (produit) => {
    if (!produit) return null;
    
    // Extract available sizes with quantities
    const taillesDisponibles = produit.tailles
      ?.filter(t => t.ArticleTaille?.quantite > 0)
      .map(t => ({
        id: t.id,
        nom: t.libelle,
        quantite: t.ArticleTaille.quantite,
        couleur_id: t.ArticleTaille.couleur_id
      })) || [];

    // Get all color options
    const couleursDisponibles = produit.couleurs?.map(c => ({
      id: c.id,
      nom: c.libelle,
      hexcode: c.hexcode
    })) || [];

    // Get images organized by color
    const imagesParCouleur = {};
    if (produit.images_couleurs) {
      produit.images_couleurs.forEach(img => {
        if (!imagesParCouleur[img.couleur_id]) {
          imagesParCouleur[img.couleur_id] = [];
        }
        imagesParCouleur[img.couleur_id].push(img.image_url);
      });
    } else if (produit.images_par_couleur) {
      Object.assign(imagesParCouleur, produit.images_par_couleur);
    }

    return {
      ...produit,
      marque: produit.marque?.libelle || produit.marque,
      tailles: taillesDisponibles,
      couleurs: couleursDisponibles,
      images_par_couleur: imagesParCouleur,
      stock: produit.stock || calculateTotalStock(produit.tailles),
      primaryImage: getPrimaryImage(produit)
    };
  };

  const handleClicAchatRapide = (produit) => {
    if (!produit?.id) {
      toast.error("Données produit invalides");
      return;
    }
    setProduitAchatRapide(preparerProduitPourModal(produit));
  };

  const handleAjoutPanier = async ({ produit, tailleSelectionnee, quantite, couleurSelectionnee }) => {
    try {
      if (!produit?.id || !tailleSelectionnee?.id || !couleurSelectionnee?.id) {
        throw new Error("Produit, taille ou couleur invalide");
      }

      const response = await axios.post(
        "http://localhost:5000/panier/ajouterAuPanier",
        {
          articles: [{
            article_id: produit.id,
            quantite: quantite,
            taille_id: tailleSelectionnee.id,
            couleur_id: couleurSelectionnee.id,
            prix_au_moment_ajout: produit.prix_final || produit.prix
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
    } catch (erreur) {
      console.error("Erreur lors de l'ajout au panier:", erreur);
      toast.error(erreur.response?.data?.message || "Erreur lors de l'ajout au panier");
      return false;
    }
  };

  const handleAchatRapide = async ({ produit, tailleSelectionnee, couleurSelectionnee }) => {
    const ajoute = await handleAjoutPanier({
      produit,
      tailleSelectionnee,
      couleurSelectionnee,
      quantite: 1
    });
    
    if (ajoute) {
      window.location.href = '/caisse';
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-2/3">
        <div className="grid grid-cols-4 gap-4">
          {produitsCourants.length > 0 ? (
            produitsCourants.map((produit) => {
              const primaryImage = getPrimaryImage(produit);
              const stock = produit.stock || calculateTotalStock(produit.tailles);
              const marque = produit.marque?.libelle || produit.marque;

              return (
                <div key={produit.id} className="relative group transition-all duration-300">
                  <Link href={`/store/products/${produit.id}`}>
                    <Image
                      src={primaryImage}
                      alt={produit.nom_produit || "Image du produit"}
                      width={300}
                      height={200}
                      className="object-contain rounded-sm my-5 cursor-pointer"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                  </Link>

                  <div className="-ml-5 justify-center">
                    <div className="w-full flex justify-center mt-2">
                      <div className="text-center border border-black text-black bg-white rounded-none text-[10px] font-mono px-2 py-1">
                        <span>PETIT PRIX</span>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <p className="text-gray-700 text-sm font-normal font-mono tracking-widest">
                        {marque || "Marque inconnue"}
                      </p>

                      <div className="group-hover:opacity-0 transition-opacity duration-300">
                        <p className="text-gray-700 font-mono text-xs mt-1">
                          {produit.nom_produit || "Produit sans nom"}
                        </p>
                        <p className="text-sm font-mono font-semibold mt-1">
                          {produit.prix_final || produit.prix || 0} DT
                          {produit.remise > 0 && (
                            <span className="text-gray-400 line-through ml-2">
                              {produit.prix} DT
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
                              handleClicAchatRapide(produit);
                            }}
                            className="bg-black border border-black text-white font-mono text-xs px-4 py-2 rounded-full flex items-center hover:bg-white hover:text-black transition-all duration-300"
                          >
                            Achat Rapide
                          </button>
                          <GoHeart className="w-5 h-5 cursor-pointer mt-2" />
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

        {totalPages > 1 && (
          <div className="flex justify-end mt-8 mb-4">
            <Pagination
              count={totalPages}
              page={pageCourante}
              onChange={handleChangementPage}
              shape="rounded"
              boundaryCount={2}
            />
          </div>
        )}

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
                      className={`bg-black text-white px-4 py-2 flex items-center gap-1 text-sm w-full lg:w-auto ${
                        (!selectedSize || !selectedColor || product.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={async () => {
                        const ajoute = await handleAjoutPanier({
                          produit: product,
                          tailleSelectionnee: selectedSize,
                          couleurSelectionnee: selectedColor,
                          quantite: 1
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
                      className={`bg-black text-white px-4 py-2 text-sm w-full lg:w-auto ${
                        (!selectedSize || !selectedColor || product.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={async () => {
                        await handleAchatRapide({ 
                          produit: product, 
                          tailleSelectionnee: selectedSize,
                          couleurSelectionnee: selectedColor
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

export default PetitProductList;