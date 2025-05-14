"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AiOutlinePlus } from "react-icons/ai";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";

const ProductDetailsModel = ({
  productId,
  onAddToCart,
  onQuickBuy,
  customButtons = null
}) => {
  const router = useRouter();
  const [produit, setProduit] = useState(null);
  const [imagePrincipale, setImagePrincipale] = useState("/image-par-defaut.jpg");
  const [tailleSelectionnee, setTailleSelectionnee] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  useEffect(() => {
    const chargerProduit = async () => {
      setChargement(true);
      setErreur(null);

      try {
        if (!productId) {
          throw new Error("Aucun ID de produit fourni");
        }

        const reponse = await axios.get(
          `http://localhost:5000/articles/obtenirArticleParId/${productId}`
        );
        const donneesProduit = reponse.data.donnees;

        if (!donneesProduit) {
          throw new Error("Produit non trouvé");
        }

        const produitTraite = {
          ...donneesProduit,
          id: productId,
          marque: typeof donneesProduit.marque === 'object' 
            ? donneesProduit.marque.libelle 
            : donneesProduit.marque,
          tailles: Array.isArray(donneesProduit.tailles) 
            ? donneesProduit.tailles.map(taille => ({
                id: taille.id,
                nom: taille.libelle || taille.nom,
                quantite: taille.quantite || taille.ArticleTaille?.quantite || 0
              })).filter(t => t.quantite > 0)
            : [],
          couleurs: Array.isArray(donneesProduit.couleurs) 
            ? donneesProduit.couleurs.map(couleur => ({
                id: couleur.id,
                nom: couleur.libelle,
                codeHex: couleur.hexcode || "#ccc"
              }))
            : [],
          images: Array.isArray(donneesProduit.images) 
            ? donneesProduit.images.filter(img => img)
            : ['/image-par-defaut.jpg'],
          stock: donneesProduit.stock || donneesProduit.tailles?.reduce(
            (sum, t) => sum + (t.quantite || t.ArticleTaille?.quantite || 0), 0
          ) || 0
        };

        setProduit(produitTraite);
        setImagePrincipale(produitTraite.images[0]);
      } catch (err) {
        console.error("Erreur lors du chargement du produit:", err);
        setErreur(err.message || "Échec du chargement des détails du produit. Veuillez réessayer.");
      } finally {
        setChargement(false);
      }
    };

    chargerProduit();
  }, [productId]);

  const ajouterAuPanier = async () => {
    if (!tailleSelectionnee) {
      toast.error("Veuillez sélectionner une taille");
      return;
    }

    if (!onAddToCart) {
      toast.error("Fonction d'ajout au panier non fournie");
      return;
    }

    setAjoutEnCours(true);
    try {
      const success = await onAddToCart({
        product: produit,
        selectedSize: tailleSelectionnee,
        quantity: 1
      });
      
      if (success) {
        toast.success("Produit ajouté au panier avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      toast.error(error.message || "Erreur lors de l'ajout au panier");
    } finally {
      setAjoutEnCours(false);
    }
  };

  const acheterMaintenant = async () => {
    if (!tailleSelectionnee) {
      toast.error("Veuillez sélectionner une taille");
      return;
    }

    if (!onQuickBuy) {
      toast.error("Fonction d'achat rapide non fournie");
      return;
    }

    setAjoutEnCours(true);
    try {
      await onQuickBuy({
        product: produit,
        selectedSize: tailleSelectionnee
      });
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
      toast.error(error.message || "Erreur lors du passage en caisse");
    } finally {
      setAjoutEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (erreur) {
    return <div className="text-red-500 text-center py-10">{erreur}</div>;
  }

  if (!produit) {
    return <div className="text-red-500 text-center py-10">Produit non trouvé</div>;
  }

  return (
    <section className="h-[440px] overflow-hidden mx-2 font-mono mt-2 sm:mx-4 lg:mx-2">
      <div className="px-4 sm:px-6 lg:px-10 py-6 font-mono flex flex-col lg:flex-row gap-4 h-full">
        <div className="lg:w-1/2 flex flex-row min-h-[500px] gap-4">
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {produit.images.map((image, index) => (
              <Image
                key={index}
                src={image || '/image-par-defaut.jpg'}
                alt={`${produit.nom_produit || 'Produit'} ${index + 1}`}
                width={60}
                height={60}
                className="w-[60px] h-[60px] object-cover cursor-pointer border border-gray-300 rounded"
                onClick={() => setImagePrincipale(image || '/image-par-defaut.jpg')}
                onError={(e) => {
                  e.currentTarget.src = '/image-par-defaut.jpg';
                }}
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center">
            <Image
              src={imagePrincipale || '/image-par-defaut.jpg'}
              alt={produit.nom_produit || "Image du produit"}
              width={350}
              height={350}
              className="w-[300px] h-[400px] object-cover rounded-sm"
              priority={true}
              onError={(e) => {
                e.currentTarget.src = '/image-par-defaut.jpg';
              }}
            />
          </div>
        </div>
        
        <div className="lg:w-1/2 flex flex-col min-h-[300px]">
          <div>
            <h5 className="text-sm font-mono font-bold mb-3">
              {produit.nom_produit || "Produit sans nom"} - 
              <span className="font-normal">
                {produit.marque || "Marque inconnue"}
              </span>
            </h5>
            <p className="text-sm font-semibold mb-4">{produit.prix_final || produit.prix || 0} DT</p>
            <p className="text-gray-700 mb-4 text-sm">{produit.description || "Aucune description disponible"}</p>
            
            <div className="mb-5">
              <h5 className="text-sm font-semibold mb-2">Couleurs disponibles</h5>
              <div className="flex gap-2 flex-wrap">
                {produit.couleurs?.length > 0 ? (
                  produit.couleurs.map((couleur) => (
                    <span
                      key={couleur.id}
                      className="w-8 h-8 border-2 border-blue-100 flex items-center justify-center"
                      style={{ backgroundColor: couleur.codeHex }}
                      aria-label={`Couleur ${couleur.nom}`}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucune couleur disponible</p>
                )}
              </div>
            </div>
            
            <div className="mb-5">
              <h5 className="text-sm font-semibold mb-2">Tailles disponibles</h5>
              {produit.tailles?.length === 0 ? (
                <p className="text-red-500 text-sm">Aucune taille disponible pour ce produit</p>
              ) : (
                <>
                  {!tailleSelectionnee && (
                    <p className="text-red-500 text-xs mb-2">Veuillez sélectionner une taille</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {produit.tailles?.map((taille) => (
                      <button
                        key={taille.id}
                        onClick={() => setTailleSelectionnee(taille)}
                        className={`px-2.5 py-2 border text-sm ${
                          tailleSelectionnee?.id === taille.id 
                            ? "bg-black text-white" 
                            : "border-gray-400"
                        } ${
                          taille.quantite <= 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={taille.quantite <= 0}
                      >
                        {taille.nom} {taille.quantite <= 0 ? "(Rupture de stock)" : ""}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="text-sm font-semibold mb-4 relative">
              {produit.stock > 0 ? "En stock" : "Rupture de stock"} 
              {produit.stock > 0 && (
                <span className="absolute top-0 left-16 text-red-800 animate-bounce">*</span>
              )}
            </p>

            <div className="flex gap-2 mb-4">
              {customButtons ? (
                customButtons({ product: produit, selectedSize: tailleSelectionnee, isAddingToCart: ajoutEnCours })
              ) : (
                <>
                  <button
                    className={`bg-black text-white px-4 py-2 flex items-center gap-1 text-sm w-full lg:w-auto ${
                      (!tailleSelectionnee || produit.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={ajouterAuPanier}
                    disabled={!tailleSelectionnee || produit.stock <= 0 || ajoutEnCours}
                  >
                    {ajoutEnCours ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <AiOutlinePlus size={12} />
                        Ajouter au panier
                      </>
                    )}
                  </button>
                  <button
                    className={`bg-gray-800 text-white px-4 py-2 text-sm w-full lg:w-auto ${
                      (!tailleSelectionnee || produit.stock <= 0) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={acheterMaintenant}
                    disabled={!tailleSelectionnee || produit.stock <= 0 || ajoutEnCours}
                  >
                    Acheter maintenant
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailsModel;