import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'
import { persist, createJSONStorage } from 'zustand/middleware'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
})

const shippingMethods = [
  {
    id: 'standard',
    name: 'Livraison standard',
    description: 'Livraison en 3-5 jours ouvrables',
    price: 7
  },
  {
    id: 'express',
    name: 'Livraison express',
    description: 'Livraison en 1-2 jours ouvrables',
    price: 15
  }
]

export const usePanier = create(
  persist(
    (set, get) => ({
      panier: [],
      chargement: false,
      erreur: null,
      codePromo: '',
      panierId: null,
      guestToken: null,
      shippingMethod: null,
      shippingCost: 0,

      getGuestToken: () => get().guestToken,
      setGuestToken: (token) => {
        set({ guestToken: token })
        if (typeof window !== 'undefined') {
          if (token) {
            sessionStorage.setItem('guestToken', token)
          } else {
            sessionStorage.removeItem('guestToken')
          }
        }
      },

      recupererPanier: async () => {
        set({ chargement: true, erreur: null })
        try {
          const headers = {}
          const guestToken = get().getGuestToken()
          if (guestToken) headers['X-Guest-Token'] = guestToken

          const response = await api.get('/panier/obtenirPanier', { headers })
          
          if (response.data.success) {
            set({
              panier: response.data.data?.panier?.panier_articles || [],
              panierId: response.data.data?.panier?.id || null
            })
          }
        } catch (error) {
          set({ erreur: error.response?.data?.message || error.message })
        } finally {
          set({ chargement: false })
        }
      },

      supprimerArticle: async (articlePanierId) => {
        set({ chargement: true, erreur: null });
        try {
          const headers = {};
          const guestToken = get().getGuestToken();
          if (guestToken) headers['X-Guest-Token'] = guestToken;

          const response = await api.delete(
            `/panier/supprimerArticleDuPanier/${articlePanierId}`,
            { headers }
          );

          if (response.data.success) {
            toast.success('Article supprimé du panier');
            await get().recupererPanier();
            return true;
          }
          throw new Error(response.data.message || 'Failed to remove item');
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ erreur: message });
          toast.error(message || 'Failed to remove item');
          return false;
        } finally {
          set({ chargement: false });
        }
      },

      ajouterArticle: async (idArticle, idCouleur, idTaille, quantite) => {
        set({ chargement: true, erreur: null })
        try {
          const guestToken = get().getGuestToken()
          const headers = {}
          
          if (guestToken) {
            headers['X-Guest-Token'] = guestToken
          }

          const response = await api.post(
            '/panier/ajouterArticleAuPanier',
            { 
              article_id: idArticle, 
              couleur_id: idCouleur, 
              taille_id: idTaille, 
              quantite 
            },
            { headers }
          )

          if (response.data.success) {
            if (response.data.guest_token) {
              get().setGuestToken(response.data.guest_token)
            }
            await get().recupererPanier()
            toast.success('Article ajouté au panier')
            return true
          }
          throw new Error(response.data.message || 'Failed to add item')
        } catch (error) {
          const messageErreur = error.response?.data?.message || error.message
          set({ erreur: messageErreur })
          toast.error(messageErreur.includes('Stock') ? messageErreur : 'Failed to add item')
          return false
        } finally {
          set({ chargement: false })
        }
      },

      mettreAJourQuantite: async (idArticlePanier, nouvelleQuantite) => {
        set({ chargement: true, erreur: null })
        try {
          const guestToken = get().getGuestToken()
          const headers = {}
          
          if (guestToken) {
            headers['X-Guest-Token'] = guestToken
          }

          const response = await api.put(
            `/panier/mettreAJourQuantite/${idArticlePanier}`,
            { quantite: nouvelleQuantite },
            { headers }
          )

          if (response.data.success) {
            toast.success('Quantité mise à jour')
            await get().recupererPanier()
            return true
          }
          throw new Error(response.data.message || 'Failed to update quantity')
        } catch (error) {
          const messageErreur = error.response?.data?.message || error.message
          set({ erreur: messageErreur })
          toast.error(messageErreur.includes('Stock') ? messageErreur : 'Failed to update quantity')
          return false
        } finally {
          set({ chargement: false })
        }
      },

      initialiserCommande: async (isAuthenticated) => {
        set({ chargement: true, erreur: null });
        try {
          const headers = {};
          const guestToken = get().getGuestToken();
          if (guestToken) headers['X-Guest-Token'] = guestToken;
      
          await get().recupererPanier();
      
          if (!get().panierId) {
            throw new Error("Aucun panier actif trouvé");
          }
      
          if (get().panier.length === 0) {
            throw new Error("Votre panier est vide");
          }
      
          const payload = {
            panier_id: get().panierId
          };
      
          const response = await api.post('/caisse/initialiser', payload, { headers });
          
          if (response.data.success) {
            if (isAuthenticated && guestToken) {
              get().setGuestToken(null);
            }
            
            return response.data.data?.etapeSuivante || 
                  (isAuthenticated ? '/caisse/adresse' : '/caisse/identification');
          }
          
          const errorMessage = response.data.message || 'Initialization failed';
          if (errorMessage.includes('panier') || errorMessage.includes('stock')) {
            await get().recupererPanier();
          }
          
          throw new Error(errorMessage);
        } catch (error) {
          console.error('Initialization error:', error);
          const message = error.response?.data?.message || error.message;
          set({ erreur: message });
          
          if (error.response?.status === 400) {
            if (message.includes('panier vide')) {
              await get().recupererPanier();
              toast.error('Votre panier est vide');
            } else if (message.includes('stock')) {
              toast.error('Certains articles ne sont plus disponibles');
            }
          }
          
          throw error;
        } finally {
          set({ chargement: false });
        }
      },

      sauvegarderAdresseLivraison: async (adresseData) => {
        set({ chargement: true, erreur: null });
        try {
          const response = await api.post('/caisse/adresse', adresseData);
          
          if (response.data.success) {
            return {
              adresse_id: response.data.data.adresse_id,
              etapeSuivante: response.data.data.etapeSuivante || '/caisse/livraison'
            };
          }
          throw new Error(response.data.message || 'Failed to save address');
        } catch (error) {
          console.error('Address save error:', error);
          const message = error.response?.data?.message || error.message;
          set({ erreur: message });
          throw error;
        } finally {
          set({ chargement: false });
        }
      },

      traiterPaiement: async (methodePaiement, adresse_id) => {
        set({ chargement: true, erreur: null });
        try {
          if (!adresse_id) {
            throw new Error('Aucune adresse de livraison sélectionnée');
          }

          const { shippingMethod, shippingCost } = get();
          
          if (!shippingMethod) {
            throw new Error('Aucun mode de livraison sélectionné');
          }

          const response = await api.post('/caisse/paiement', { 
            methodePaiement,
            adresse_id,
            shipping_method: shippingMethod,
            shipping_cost: shippingCost
          });

          if (response.data.success) {
            set({ 
              panier: [], 
              panierId: null,
            });
            
            return {
              success: true,
              commandeId: response.data.data.commandeId,
              commandeReference: response.data.data.commandeReference,
              etapeSuivante: `/caisse/confirmation/${response.data.data.commandeReference}`,
              shippingMethod,
              shippingCost
            };
          }
          
          throw new Error(response.data.message || 'Payment processing failed');
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ erreur: message });
          
          if (error.response?.status === 400) {
            if (message.includes('stock')) {
              toast.error('Certains articles ne sont plus disponibles en quantité suffisante');
            } else if (message.includes('panier')) {
              toast.error('Votre panier a été modifié');
            }
          } else {
            toast.error('Erreur lors du traitement du paiement');
          }
          
          throw error;
        } finally {
          set({ chargement: false });
        }
      },

      initShipping: () => {
        if (typeof window !== 'undefined') {
          const currentState = get();
          if (currentState.shippingMethod && currentState.shippingCost) {
            return;
          }

          const method = sessionStorage.getItem('shipping_method') || currentState.shippingMethod;
          const cost = parseFloat(
            sessionStorage.getItem('shipping_cost') || currentState.shippingCost || '0'
          );
          
          set({ 
            shippingMethod: method,
            shippingCost: isNaN(cost) ? 0 : cost
          });
        }
      },

      sauvegarderMethodeLivraison: async (methodeId) => {
        set({ chargement: true });
        try {
          const method = shippingMethods.find(m => m.id === methodeId);
          const shippingCost = method ? method.price : 0;
          
          set({ 
            shippingMethod: methodeId,
            shippingCost 
          });
          
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('shipping_method', methodeId);
            sessionStorage.setItem('shipping_cost', shippingCost.toString());
          }

          return { success: true };
        } catch (error) {
          set({ erreur: error.response?.data?.message || error.message });
          throw error;
        } finally {
          set({ chargement: false });
        }
      },

      getSubtotal: () => {
        const { panier } = get();
        return panier.reduce((total, item) => 
          total + (item.prix_au_moment_ajout * item.quantite), 0
        ).toFixed(2);
      },

      getTotal: () => {
        const { panier, shippingCost } = get();
        const subtotal = panier.reduce((total, item) => 
          total + (item.prix_au_moment_ajout * item.quantite), 0
        );
        return (subtotal + shippingCost).toFixed(2);
      },

      viderPanier: async () => {
        try {
          const panierId = get().panierId;
          if (!panierId) return true;
      
          const headers = {};
          const guestToken = get().getGuestToken();
          if (guestToken) headers['X-Guest-Token'] = guestToken;
      
          const response = await api.delete(`/panier/viderPanier/${panierId}`, { headers });
          
          if (response.data.success) {
            set({ panier: [], panierId: null });
            return true;
          }
          return false;
        } catch (error) {
          if (error.response?.status === 404) {
            set({ panier: [], panierId: null });
            return true;
          }
          console.error('Error clearing cart:', error);
          return false;
        }
      },

      obtenirConfirmationCommande: async (reference) => {
        set({ chargement: true, erreur: null });
        try {
          if (!reference || typeof reference !== 'string') {
            throw new Error('La référence de commande est requise');
          }
      
          const response = await api.get(`/caisse/confirmation/${reference}`);
          
          if (response.data.success) {
            if (!response.data.data?.commande) {
              throw new Error('Structure de données de commande invalide');
            }
            return {
              ...response.data.data.commande,
              reference: response.data.data.commandeReference
            };
          }
          
          throw new Error(response.data.message || 'Échec de la récupération de la commande');
        } catch (error) {
          console.error('Error fetching order:', error);
          const message = error.response?.data?.message || error.message;
          set({ erreur: message });
          throw error;
        } finally {
          set({ chargement: false });
        }
      },
    }),
    
    { 
      name: 'panier-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        panierId: state.panierId,
        guestToken: state.guestToken,
        shippingMethod: state.shippingMethod,
        shippingCost: state.shippingCost,
        panier: state.panier
      })
    }
  )
)