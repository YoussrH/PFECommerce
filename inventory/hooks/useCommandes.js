// useCommandes.js
'use client';
import { useEffect, useMemo } from 'react';
import { useCommandesStore } from './useCommandesStore';

export const useCommandes = (params = {}) => {
  const { commandes, total, loading, error, fetchCommandes } = useCommandesStore();
  
  const memoizedParams = useMemo(() => ({
    page: params.page || 1,
    limit: params.limit || 10,
    search: params.search || '',
    statut: params.statut === 'tous' ? '' : params.statut || ''
  }), [params.page, params.limit, params.search, params.statut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommandes(memoizedParams);
    }, 300);

    return () => clearTimeout(timer);
  }, [memoizedParams, fetchCommandes]);

  return {
    data: { commandes, total },
    isLoading: loading,
    isError: !!error,
    refetch: () => fetchCommandes(memoizedParams)
  };
};

export const useCommandeDetails = (id) => {
  const { commande, loading, error, fetchCommandeDetails } = useCommandesStore();

  useEffect(() => {
    if (id) {
      fetchCommandeDetails(id);
    }
  }, [id, fetchCommandeDetails]);

  return {
    data: commande,
    isLoading: loading,
    isError: !!error,
    refetch: () => id && fetchCommandeDetails(id)
  };
};

export const useUpdateCommandeStatus = () => {
  const { updateStatus } = useCommandesStore();
  
  const mutateAsync = async ({ id, statut }) => {
    try {
      await updateStatus(id, statut);
      return true;
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  };

  return { mutateAsync };
};

export const useCancelCommande = () => {
  const { cancelCommande } = useCommandesStore();
  
  const mutateAsync = async ({ id, raison, rembourser }) => {
    try {
      await cancelCommande(id, raison, rembourser);
      return true;
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  };

  return { mutateAsync };
};

export const useGenerateInvoice = () => {
  const { generateInvoice } = useCommandesStore();
  
  const mutateAsync = async (id) => {
    try {
      await generateInvoice(id);
      return true;
    } catch (error) {
      console.error('Generate invoice error:', error);
      throw error;
    }
  };
  

  return { mutateAsync };
};

export const useGenerateColisInvoice = () => {
  const { generateColisInvoice } = useCommandesStore();

  const mutateAsync = async (id) => {
    try {
      await generateColisInvoice(id);
      return true;
    } catch (error) {
      console.error('Generate colis invoice error:', error);
      throw error;
    }
  };

  return { mutateAsync };
};

