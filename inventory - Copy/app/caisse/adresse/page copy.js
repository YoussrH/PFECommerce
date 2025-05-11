'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import zipData from '@/app/data/zip-postcodes.json'; 
import CartSummary from '@/app/components/caisse/CartSummary';
import { useRouter } from 'next/navigation';
import useCartStore from '@/app/components/caisse/cartStore';

export default function AdresseLivraison() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { saveShippingAddress, checkoutData } = useCartStore();

  // Initialize form with any previously saved data
  const [shipping, setShipping] = useState({
    country: 'Tunisia',
    address: checkoutData.address?.address || '',
    complement: checkoutData.address?.complement || '',
    postalCode: checkoutData.address?.postalCode || '',
    city: checkoutData.address?.city || '',
    governorate: checkoutData.address?.governorate || '',
    phone: checkoutData.address?.phone || ''
  });

  const [formErrors, setFormErrors] = useState({
    address: '',
    postalCode: '',
    governorate: '',
    phone: ''
  });

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!shipping.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    if (!shipping.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
      isValid = false;
    } else if (!/^\d+$/.test(shipping.postalCode)) {
      errors.postalCode = 'Postal code must be numeric';
      isValid = false;
    }

    if (!shipping.governorate.trim()) {
      errors.governorate = 'Governorate is required';
      isValid = false;
    }

    if (!shipping.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{8}$/.test(shipping.phone)) {
      errors.phone = 'Phone must be 8 digits';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const fetchSuggestions = useCallback((query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filteredResults = zipData.filter(entry =>
        entry.Cite.toLowerCase().includes(query.toLowerCase()) ||
        entry.Gov.toLowerCase().includes(query.toLowerCase()) ||
        entry.Deleg.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(filteredResults);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load address suggestions');
      toast.error('Could not load address suggestions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(
    debounce(fetchSuggestions, 300),
    [debounce, fetchSuggestions]
  );

  const handleSelectSuggestion = useCallback((suggestion) => {
    setShipping(prev => ({
      ...prev,
      address: suggestion.Cite || '',
      postalCode: suggestion.zip || '',
      city: suggestion.Deleg || '',
      governorate: suggestion.Gov || ''
    }));
    setSuggestions([]);
    // Clear errors for these fields
    setFormErrors(prev => ({
      ...prev,
      address: '',
      postalCode: '',
      governorate: ''
    }));
  }, []);

  const handleShippingChange = useCallback((e) => {
    const { name, value } = e.target;
    setShipping(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'address') {
      debouncedFetch(value);
    }
  }, [debouncedFetch, formErrors]);

  useEffect(() => {
    const handleClickOutside = () => setSuggestions([]);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const nextStep = await saveShippingAddress({
        address: shipping.address,
        complement: shipping.complement,
        postalCode: shipping.postalCode,
        city: shipping.city,
        governorate: shipping.governorate,
        phone: shipping.phone
      });
      
      router.push(nextStep);
    } catch (error) {
      console.error('Shipping address error:', error);
      toast.error(error.message || 'Error saving shipping address');
      
      // Handle specific error cases
      if (error.message.includes('404')) {
        toast.error('Server endpoint not found. Please contact support.');
      } else if (error.message.includes('401')) {
        toast.error('Session expired. Please log in again.');
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    router.replace('/caisse/panier');
  };

  return (
    <div className="flex w-full max-w-4xl mx-80 pl-16 gap-5">
      <div className="flex-1  max-w-lg">
        <div className="max-w-md mx-auto p-4 relative">
          <h2 className="text-lg font-bold mb-6">Adresse de Livraison</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Pays *</label>
              <Input 
                name="country" 
                value="Tunisia" 
                disabled 
                className="w-full" 
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-1">Adresse *</label>
              <Input
                name="address"
                value={shipping.address}
                onChange={handleShippingChange}
                required
                className={`w-full ${formErrors.address ? 'border-red-500' : ''}`}
                placeholder="Commencez à taper votre adresse..."
              />
              {formErrors.address && (
                <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
              )}
              {isLoading && <div className="absolute right-3 top-3 animate-spin rounded-none h-4 w-4 border-b-2 border-gray-900"></div>}
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-none shadow-lg max-h-60 overflow-auto" onClick={(e) => e.stopPropagation()}>
                  {suggestions.map((suggestion, index) => (
                    <li 
                      key={index} 
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      {suggestion.Cite}, {suggestion.Deleg} ({suggestion.zip})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Complément d&apos;adresse</label>
              <Input 
                name="complement" 
                value={shipping.complement} 
                onChange={handleShippingChange} 
                className="w-full rounded-none" 
                placeholder="Appartement, étage, etc." 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gouvernorat *</label>
                <Input
                  name="governorate"
                  value={shipping.governorate}
                  onChange={handleShippingChange}
                  required
                  className={`w-full rounded-none ${formErrors.governorate ? 'border-red-500' : ''}`}
                />
                {formErrors.governorate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.governorate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code Postal *</label>
                <Input
                  name="postalCode"
                  value={shipping.postalCode}
                  onChange={handleShippingChange}
                  required
                  className={`w-full rounded-none ${formErrors.postalCode ? 'border-red-500' : ''}`}
                  pattern="[0-9]*"
                />
                {formErrors.postalCode && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone *</label>
              <Input
                name="phone"
                value={shipping.phone}
                onChange={handleShippingChange}
                required
                className={`w-full rounded-none ${formErrors.phone ? 'border-red-500' : ''}`}
                type="tel"
                pattern="[0-9]{8}"
                placeholder="+216 __ ___ ___"
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="text-xs rounded-none border border-black"
                type="button"
              >
                Étape précédente
              </Button>
              <Button
                type="submit"
                className="text-xs rounded-none bg-black text-white border border-black hover:bg-white hover:text-black"
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' : "Suivant"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden md:block">
        <CartSummary 
          showPromoCode={false}
          showCheckoutButton={false}
        />
      </div>
    </div>
  );
}