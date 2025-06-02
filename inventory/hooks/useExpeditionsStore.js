'use client'
import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: 'http://localhost:5000/expeditions',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

export const useExpeditionsStore = create((set, get) => ({
  expeditions: [],
  colis: [],
  retours: [],
  loading: false,
  error: null,

stats: {
    totalColis: 0,
    enPreparation: 0,
    expediees: 0,
    livrees: 0,
    retournees: 0,
    annulees: 0
  },

  // Helper to map package status to display text
  mapColisStatus: (status) => {
    switch(status) {
      case 'en_preparation': return 'Préparée';
      case 'expediee': return 'En route';
      case 'livree': return 'Livrée';
      case 'retourne': return 'Retourné';
      case 'remplacee': return 'Remplaceé';
      case 'annulee': return 'Annulé';
      default: return status;
    }
  },
 calculateColisStats: (colis) => {
    return {
      totalColis: colis.length,
      enPreparation: colis.filter(c => c.statut === 'en_preparation').length,
      expediees: colis.filter(c => c.statut === 'expediee').length,
      livrees: colis.filter(c => c.statut === 'livree').length,
      retournees: colis.filter(c => c.statut === 'retourne').length,
      annulees: colis.filter(c => c.statut === 'annulee').length
    };
  },

  // Fetch packages with QR code data
  fetchColis: async (params = {}) => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    try {
      const { page = 1, limit = 10, statut, commande_id } = params;
      
      // Fetch both filtered and all colis (for stats)
      const [filteredRes, allRes] = await Promise.all([
        api.get('/colis', { 
          params: { 
            page, 
            limit, 
            statut: statut === 'Préparée' ? 'en_preparation' :
                   statut === 'En route' ? 'expediee' :
                   statut === 'Livrée' ? 'livree' :
                   statut === 'Retourné' ? 'retourne' :
                   statut === 'Échec de livraison' ? 'retourne' : statut,
            commande_id 
          }
        }),
        // Fetch all colis for stats (without filters)
        api.get('/colis', { params: { page: 1, limit: 10000 } }) // Adjust limit as needed
      ]);
      
      if (!filteredRes.data?.success || !allRes.data?.success) {
        throw new Error('Invalid response format');
      }
      
      // Transform data to include mapped status
      const transformColis = (colis) => ({
        ...colis,
        display_status: get().mapColisStatus(colis.statut),
        qr_code_data: colis.qr_code_data || null,
        commande_reference: colis.commande?.reference || 'N/A',
        client_nom: colis.commande?.client?.utilisateur?.nom || 'N/A',
        client_prenom: colis.commande?.client?.utilisateur?.prenom || 'N/A'
      });
      
      const filteredColis = filteredRes.data.data?.colis?.map(transformColis) || [];
      const allColis = allRes.data.data?.colis?.map(transformColis) || [];
      
      // Calculate stats from ALL colis (unfiltered)
      const stats = get().calculateColisStats(allColis);
      
      set({ 
        colis: filteredColis,
        stats,
        total: filteredRes.data.data?.total || 0,
        pages: filteredRes.data.data?.pages || 1
      });
      
      return filteredRes.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to fetch packages';
      set({ error: message });
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Helper to map package status to display text


  // Calculate stats from expeditions
  calculateStats: (expeditions) => {
    return {
      totalExpeditions: expeditions.length,
      enPreparation: expeditions.filter(e => e.statut === 'en_preparation').length,
      enRoute: expeditions.filter(e => e.statut === 'expediee').length,
      livrees: expeditions.filter(e => e.statut === 'livree').length,
      echecs: expeditions.filter(e => e.statut === 'retourne' || e.statut === 'echec').length
    };
  },

  // Fetch expeditions with statistics
fetchExpeditions: async (params = {}) => {
  if (get().loading) return;
  
  set({ loading: true, error: null });
  try {
    const { page = 1, limit = 10, statut, livreur_id } = params;
    
    // Fetch filtered expeditions
    const [filteredRes, allRes] = await Promise.all([
      api.get('/', { 
        params: { 
          page, 
          limit, 
          statut,
          livreur_id
        }
      }),
      // Fetch all expeditions for stats (without filters)
      api.get('/', { params: { page: 1, limit: 10000 } }) // Adjust limit as needed
    ]);
    
    if (!filteredRes.data?.success || !allRes.data?.success) {
      throw new Error('Invalid response format');
    }
    
    const mapExpedition = (exp) => ({
      ...exp,
      statut_expedition: get().mapColisStatus(exp.statut),
      display_status: get().mapColisStatus(exp.statut)
    });
    
    const filteredExpeditions = filteredRes.data.data?.expeditions?.map(mapExpedition) || [];
    const allExpeditions = allRes.data.data?.expeditions?.map(mapExpedition) || [];
    
    // Calculate stats from ALL expeditions (unfiltered)
    const stats = get().calculateStats(allExpeditions);
    
    set({ 
      expeditions: filteredExpeditions,
      stats,
      total: filteredRes.data.data?.total || 0
    });
    return filteredRes.data.data;
  } catch (error) {
    const message = error.response?.data?.message || 
                   error.message || 
                   'Failed to fetch expeditions';
    set({ error: message });
    toast.error(message);
    throw error;
  } finally {
    set({ loading: false });
  }
},
  // Update package status (now works with colis ID)
  updateExpeditionStatus: async ({ id, statut_expedition, notes }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      // Map display status to colis status
      const colisStatut = statut_expedition === 'Préparée' ? 'en_preparation' :
                         statut_expedition === 'En route' ? 'expediee' :
                         statut_expedition === 'Livrée' ? 'livree' :
                         statut_expedition === 'Échec de livraison' ? 'retourne' : statut_expedition;

      const res = await api.put(`/expeditions/${id}/statut`, { 
        statut_expedition: colisStatut,
        notes 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update status');
      }
      
      toast.success(res.data.message || "Statut du colis mis à jour");
      
      // Refresh both expeditions and packages lists
      await Promise.all([
        get().fetchExpeditions(),
        get().fetchColis()
      ]);
      
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update package status';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  // Create/update package
  manageColis: async ({ id, commande_id, livreur_id }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const method = id ? 'put' : 'post';
      const url = id ? `/colis/${id}` : '/colis';
      
      const res = await api[method](url, { 
        commande_id, 
        livreur_id 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to manage package');
      }
      
      toast.success(res.data.message || "Colis géré avec succès");
      await get().fetchColis();
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to manage package';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
// Add this helper function to map return status
mapRetourStatus: (status) => {
  switch(status) {
    case 'en_attente': return 'En cours';
    case 'traite': return 'Traité';
    case 'accepte': return 'Accepté';
    case 'refuse': return 'Refusé';
    case 'cloture': return 'Clôturé';
    default: return status;
  }
},

// Add this function to calculate return stats
calculateRetourStats: (retours) => {
  return {
    totalRetours: retours.length,
    enCours: retours.filter(r => r.statut === 'en_attente').length,
    acceptes: retours.filter(r => r.statut === 'accepte').length,
    refuses: retours.filter(r => r.statut === 'refuse').length,
    clotures: retours.filter(r => r.statut === 'cloture').length
  };
},

// Update your fetchRetours function to include stats calculation
fetchRetours: async (params = {}) => {
  if (get().loading) return;
  
  set({ loading: true, error: null });
  try {
    const { page = 1, limit = 10, statut, type } = params;
    
    // Fetch both filtered and all returns (for stats)
    const [filteredRes, allRes] = await Promise.all([
      api.get('/retours', { 
        params: { 
          page, 
          limit, 
          statut: statut === 'En cours' ? 'en_preparation' :
                 statut === 'Accepté' ? 'approuve' :
                 statut === 'Refusé' ? 'refuse' :
                 statut === 'Clôturé' ? 'traite' : statut,
          type 
        }
      }),
      // Fetch all returns for stats (without filters)
      api.get('/retours', { params: { page: 1, limit: 10000 } }) // Adjust limit as needed
    ]);
    
    if (!filteredRes.data?.success || !allRes.data?.success) {
      throw new Error('Invalid response format');
    }
    
    // Transform data to include mapped status
    const transformRetour = (retour) => ({
      ...retour,
      display_status: get().mapRetourStatus(retour.statut),
      commande_reference: retour.commande?.reference || 'N/A',
      client_nom: retour.commande?.client?.utilisateur?.nom || 'N/A',
      client_prenom: retour.commande?.client?.utilisateur?.prenom || 'N/A'
    });
    
    const filteredRetours = filteredRes.data.data?.retours?.map(transformRetour) || [];
    const allRetours = allRes.data.data?.retours?.map(transformRetour) || [];
    
    // Calculate stats from ALL returns (unfiltered)
    const stats = get().calculateRetourStats(allRetours);
    
    set({ 
      retours: filteredRetours,
      stats, // This will include the return statistics
      total: filteredRes.data.data?.total || 0,
      pages: filteredRes.data.data?.pages || 1
    });
    
    return filteredRes.data.data;
  } catch (error) {
    const message = error.response?.data?.message || 
                   error.message || 
                   'Failed to fetch returns';
    set({ error: message });
    toast.error(message);
    throw error;
  } finally {
    set({ loading: false });
  }
},

  // Process return
  processReturn: async ({ id, decision, motif_refus, notes }) => {
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const res = await api.put(`/retours/${id}/traiter`, { 
        decision, 
        motif_refus, 
        notes 
      });
      
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to process return');
      }
      
      toast.success(res.data.message || "Retour traité avec succès");
      await get().fetchRetours();
      return res.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to process return';
      toast.error(message);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}))