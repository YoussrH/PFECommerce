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
  const [taillesSelectionnees, setTaillesSelectionnees] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [couleurSelectionnee, setCouleurSelectionnee] = useState(null);
  const [imagesParCouleur, setImagesParCouleur] = useState({});

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

        // Process images by color
        const imagesParCouleurTemp = {};
        const couleursDisponibles = [];
        
        if (donneesProduit.images_par_couleur) {
          Object.entries(donneesProduit.images_par_couleur).forEach(([couleurId, data]) => {
            imagesParCouleurTemp[couleurId] = data.images;
            couleursDisponibles.push({
              id: couleurId,
              nom: data.couleur.libelle,
              codeHex: data.couleur.hexcode || "#ccc"
            });
          });
        } else if (donneesProduit.images_couleurs) {
          donneesProduit.images_couleurs.forEach(img => {
            if (!imagesParCouleurTemp[img.couleur_id]) {
              imagesParCouleurTemp[img.couleur_id] = [];
              couleursDisponibles.push({
                id: img.couleur_id,
                nom: img.couleur?.libelle || "Couleur inconnue",
                codeHex: img.couleur?.hexcode || "#ccc"
              });
            }
            imagesParCouleurTemp[img.couleur_id].push(img.image_url);
          });
        }

        setImagesParCouleur(imagesParCouleurTemp);

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
          couleurs: couleursDisponibles.length > 0 
            ? couleursDisponibles 
            : Array.isArray(donneesProduit.couleurs) 
              ? donneesProduit.couleurs.map(couleur => ({
                  id: couleur.id,
                  nom: couleur.libelle,
                  codeHex: couleur.hexcode || "#ccc"
                }))
              : [],
          stock: donneesProduit.stock || donneesProduit.tailles?.reduce(
            (sum, t) => sum + (t.quantite || t.ArticleTaille?.quantite || 0), 0
          ) || 0
        };

        setProduit(produitTraite);
        
        if (couleursDisponibles.length > 0) {
          const initialColorId = couleursDisponibles[0].id;
          setCouleurSelectionnee(initialColorId);
          if (imagesParCouleurTemp[initialColorId]?.length > 0) {
            setImagePrincipale(imagesParCouleurTemp[initialColorId][0]);
          }
        }
        
        const initialQuantites = {};
        produitTraite.tailles.forEach(taille => {
          initialQuantites[taille.id] = 1;
        });
        setQuantites(initialQuantites);
      } catch (err) {
        console.error("Erreur lors du chargement du produit:", err);
        setErreur(err.message || "Échec du chargement des détails du produit. Veuillez réessayer.");
      } finally {
        setChargement(false);
      }
    };

    chargerProduit();
  }, [productId]);

  const handleColorSelection = (couleurId) => {
    setCouleurSelectionnee(couleurId);
    if (imagesParCouleur[couleurId]?.length > 0) {
      setImagePrincipale(imagesParCouleur[couleurId][0]);
    }
  };

  const toggleTailleSelection = (taille) => {
    setTaillesSelectionnees(prev => {
      if (prev.some(t => t.id === taille.id)) {
        return prev.filter(t => t.id !== taille.id);
      } else {
        return [...prev, taille];
      }
    });
  };

  const updateQuantite = (tailleId, newQuantite) => {
    setQuantites(prev => ({
      ...prev,
      [tailleId]: Math.max(1, newQuantite)
    }));
  };

  const handleAjoutPanier = async () => {
    if (taillesSelectionnees.length === 0) {
      toast.error("Veuillez sélectionner au moins une taille");
      return;
    }

    setAjoutEnCours(true);
    try {
      const itemsToAdd = taillesSelectionnees.map(taille => ({
        article_id: produit.id,
        quantite: quantites[taille.id] || 1,
        taille_id: taille.id,
        couleur_id: couleurSelectionnee || null,
        prix_au_moment_ajout: produit.prix_final || produit.prix
      }));

      const response = await axios.post(
        'http://localhost:5000/panier/ajouterAuPanier',
        { articles: itemsToAdd },
        { withCredentials: true }
      );

      if (response.data.success) {
        const addedItems = taillesSelectionnees.map(t => 
          `${t.nom} (x${quantites[t.id] || 1})`
        ).join(', ');
        
        toast.success(`${produit.nom_produit} - ${addedItems} ajouté(s) au panier`);
        window.dispatchEvent(new Event('cartUpdated'));
        setTaillesSelectionnees([]);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Erreur lors de l'ajout au panier";
      
      if (error.response?.data?.stock_disponible !== undefined) {
        toast.error(`${errorMessage}. Stock disponible: ${error.response.data.stock_disponible}`);
      } else {
        toast.error(errorMessage);
      }
      
      if (error.response?.status === 401) {
        router.push('/connexion');
      }
    } finally {
      setAjoutEnCours(false);
    }
  };

  const acheterMaintenant = async () => {
    await handleAjoutPanier();
    router.push('/paiement');
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

  const currentColorImages = couleurSelectionnee 
    ? imagesParCouleur[couleurSelectionnee] || []
    : Object.values(imagesParCouleur).flat() || [];

  return (
    <section className="h-[440px] overflow-hidden mx-2 font-mono mt-2 sm:mx-4 lg:mx-2">
      <div className="px-4 sm:px-6 lg:px-10 py-6 font-mono flex flex-col lg:flex-row gap-4 h-full">
        {/* Product images section */}
        <div className="lg:w-1/2 flex flex-row min-h-[500px] gap-4">
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {currentColorImages.map((image, index) => (
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
        
        {/* Product details section */}
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
            
            {/* Colors section */}
            <div className="mb-5">
              <h5 className="text-sm font-semibold mb-2">Couleurs disponibles</h5>
              <div className="flex gap-2 flex-wrap">
                {produit.couleurs?.length > 0 ? (
                  produit.couleurs.map((couleur) => (
                    <button
                      key={couleur.id}
                      className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-all ${
                        couleurSelectionnee === couleur.id 
                          ? 'border-blue-500 scale-110' 
                          : 'border-blue-100'
                      }`}
                      style={{ backgroundColor: couleur.codeHex }}
                      aria-label={`Couleur ${couleur.nom}`}
                      onClick={() => handleColorSelection(couleur.id)}
                      title={couleur.nom}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucune couleur disponible</p>
                )}
              </div>
              {couleurSelectionnee && (
                <p className="text-xs mt-2 text-gray-600">
                  {produit.couleurs.find(c => c.id === couleurSelectionnee)?.nom}
                </p>
              )}
            </div>
            
            {/* Sizes section */}
            <div className="mb-5">
              <h5 className="text-sm font-semibold mb-2">Tailles disponibles</h5>
              {produit.tailles?.length === 0 ? (
                <p className="text-red-500 text-sm">Aucune taille disponible pour ce produit</p>
              ) : (
                <>
                  {taillesSelectionnees.length === 0 && (
                    <p className="text-red-500 text-xs mb-2">Veuillez sélectionner au moins une taille</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {produit.tailles?.map((taille) => (
                      <div key={taille.id} className="flex flex-col gap-1">
                        <button
                          onClick={() => toggleTailleSelection(taille)}
                          className={`px-2.5 py-2 border text-sm ${
                            taillesSelectionnees.some(t => t.id === taille.id)
                              ? "bg-black text-white" 
                              : "border-gray-400"
                          } ${
                            taille.quantite <= 0 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={taille.quantite <= 0}
                        >
                          {taille.nom} {taille.quantite <= 0 ? "(Rupture de stock)" : ""}
                        </button>
                        
                        {taillesSelectionnees.some(t => t.id === taille.id) && (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantite(taille.id, (quantites[taille.id] || 1) - 1);
                              }}
                              className="px-1.5 py-0.5 border text-sm"
                            >
                              -
                            </button>
                            <span className="text-sm">{quantites[taille.id] || 1}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantite(taille.id, (quantites[taille.id] || 1) + 1);
                              }}
                              className="px-1.5 py-0.5 border text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
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
                customButtons({
                  product: produit,
                  selectedSize: taillesSelectionnees[0],
                  isAddingToCart: ajoutEnCours
                })
              ) : (
                <>
                  <button
                    onClick={handleAjoutPanier}
                    disabled={taillesSelectionnees.length === 0 || ajoutEnCours}
                    className={`
                      bg-black text-white px-4 py-2 flex items-center gap-1 text-sm w-full lg:w-auto
                      ${taillesSelectionnees.length === 0 || ajoutEnCours 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-gray-900 active:bg-gray-800"
                      }
                    `}
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
                    onClick={acheterMaintenant}
                    disabled={taillesSelectionnees.length === 0 || ajoutEnCours}
                    className={`
                      bg-gray-800 text-white px-4 py-2 text-sm w-full lg:w-auto
                      ${taillesSelectionnees.length === 0 || ajoutEnCours 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-gray-700 active:bg-gray-600"
                      }
                    `}
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