// hooks/useCartDiscounts.js
import { useState, useEffect } from 'react';
import { useRemiseVerification } from './useRemiseVerification';

export const useCartDiscounts = (initialCart = []) => {
  const [cart, setCart] = useState(initialCart);
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const { verification, verifyRemise, resetVerification } = useRemiseVerification();

  // Calculate cart totals with discounts
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const discountTotal = appliedDiscounts.reduce((sum, discount) => {
      return sum + discount.montant_remise;
    }, 0);

    const total = subtotal - discountTotal;

    return {
      subtotal,
      discountTotal,
      total,
      discountCount: appliedDiscounts.length
    };
  };

  // Apply a discount to the cart
  const applyDiscount = async (codePromo) => {
    try {
      const result = await verifyRemise(codePromo, cart);
      
      // Check if discount is already applied
      if (appliedDiscounts.some(d => d.remise.id === result.remise.id)) {
        throw new Error('Cette remise est déjà appliquée');
      }

      setAppliedDiscounts(prev => [...prev, {
        code: codePromo,
        remise: result.remise,
        montant_remise: result.montant_remise,
        articles_eligibles: result.articles_eligibles
      }]);

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Remove a discount from the cart
  const removeDiscount = (discountId) => {
    setAppliedDiscounts(prev => prev.filter(d => d.remise.id !== discountId));
  };

  // Clear all discounts
  const clearDiscounts = () => {
    setAppliedDiscounts([]);
    resetVerification();
  };

  // Update cart items
  const updateCart = (newCart) => {
    setCart(newCart);
    
    // Revalidate all applied discounts when cart changes
    if (appliedDiscounts.length > 0) {
      const invalidDiscounts = [];
      // This would ideally re-verify each discount with the backend
      // For simplicity, we're just checking if eligible items still exist
      appliedDiscounts.forEach(discount => {
        const eligibleItems = discount.articles_eligibles.map(item => item.article_id);
        const hasEligibleItems = newCart.some(item => eligibleItems.includes(item.id));
        
        if (!hasEligibleItems) {
          invalidDiscounts.push(discount.remise.id);
        }
      });

      if (invalidDiscounts.length > 0) {
        setAppliedDiscounts(prev => 
          prev.filter(d => !invalidDiscounts.includes(d.remise.id))
        );
      }
    }
  };

  const { subtotal, discountTotal, total, discountCount } = calculateTotals();

  return {
    cart,
    updateCart,
    appliedDiscounts,
    applyDiscount,
    removeDiscount,
    clearDiscounts,
    verification,
    totals: {
      subtotal,
      discountTotal,
      total,
      discountCount
    }
  };
};