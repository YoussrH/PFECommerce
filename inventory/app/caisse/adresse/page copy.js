"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePanier } from "@/hooks/use-panier"
import { toast } from "sonner"
import zipData from "@/app/data/zip-postcodes.json"
import ResumeCommande from "@/app/components/caisse/CartSummary"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdresseLivraison() {
  const router = useRouter()
  const { sauvegarderAdresseLivraison, getTotal, chargement } = usePanier()

  const [formData, setFormData] = useState({
    adresse: "",
    complement: "",
    code_postal: "",
    ville: "",
    gouvernorat: "",
    telephone: "",
  })

  const [formErrors, setFormErrors] = useState({
    adresse: "",
    code_postal: "",
    gouvernorat: "",
    telephone: "",
  })

  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [clientAddresses, setClientAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState("")

  useEffect(() => {
    const fetchClientAddresses = async () => {
      try {
        const response = await fetch('/http://localhost:5000/clients/obtenirAdresses')
        if (response.ok) {
          const data = await response.json()
          setClientAddresses(data.data?.adresses || [])
          
          // Find and set the principal address if exists
          const principalAddress = data.data?.adresses?.find(addr => addr.est_principale)
          if (principalAddress) {
            setFormData({
              adresse: principalAddress.adresse || "",
              complement: principalAddress.complement || "",
              code_postal: principalAddress.code_postal || "",
              ville: principalAddress.ville || "",
              gouvernorat: principalAddress.gouvernorat || "",
              telephone: principalAddress.telephone || "",
            })
            setSelectedAddressId(principalAddress.id)
          }
        }
      } catch (error) {
        console.error('Error fetching client addresses:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    // Check if we have an address in session storage
    const savedAddress = sessionStorage.getItem("saved_address")
    if (savedAddress) {
      setFormData(JSON.parse(savedAddress))
    } else {
      fetchClientAddresses()
    }
  }, [])

  const validateForm = () => {
    const errors = {}
    let isValid = true

    if (!formData.adresse.trim()) {
      errors.adresse = "L'adresse est requise"
      isValid = false
    }

    if (!formData.code_postal.trim()) {
      errors.code_postal = "Le code postal est requis"
      isValid = false
    } else if (!/^\d{4}$/.test(formData.code_postal)) {
      errors.code_postal = "Le code postal doit contenir 4 chiffres"
      isValid = false
    }

    if (!formData.gouvernorat.trim()) {
      errors.gouvernorat = "Le gouvernorat est requis"
      isValid = false
    }

    if (!formData.telephone.trim()) {
      errors.telephone = "Le téléphone est requis"
      isValid = false
    } else if (!/^\d{8}$/.test(formData.telephone)) {
      errors.telephone = "Le téléphone doit contenir 8 chiffres"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const debounce = useCallback((func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }, [])

  const fetchSuggestions = useCallback(
    (query) => {
      if (query.length < 3) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const filteredResults = zipData.filter(
          (entry) =>
            entry.Cite.toLowerCase().includes(query.toLowerCase()) ||
            entry.Gov.toLowerCase().includes(query.toLowerCase()) ||
            entry.Deleg.toLowerCase().includes(query.toLowerCase()),
        )
        setSuggestions(filteredResults.slice(0, 10))
      } catch (err) {
        console.error("Error fetching suggestions:", err)
        toast.error("Could not load address suggestions")
      } finally {
        setIsLoading(false)
      }
    },
    [zipData],
  )

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), [debounce, fetchSuggestions])

  const handleSelectSuggestion = (suggestion) => {
    const newFormData = {
      ...formData,
      adresse: suggestion.Cite || "",
      code_postal: suggestion.zip || "",
      ville: suggestion.Deleg || "",
      gouvernorat: suggestion.Gov || "",
    }
    setFormData(newFormData)
    setShowSuggestions(false)
    setFormErrors({
      ...formErrors,
      adresse: "",
      code_postal: "",
      gouvernorat: "",
    })
    setSelectedAddressId("") // Reset selected address when manually entering
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value,
    }
    setFormData(newFormData)

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }

    if (name === "adresse") {
      debouncedFetch(value)
      if (value.length > 2) {
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }
    
    // Reset selected address when manually editing
    if (selectedAddressId && name !== "complement") {
      setSelectedAddressId("")
    }
  }

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId)
    if (addressId) {
      const selectedAddress = clientAddresses.find(addr => addr.id === addressId)
      if (selectedAddress) {
        setFormData({
          adresse: selectedAddress.adresse || "",
          complement: selectedAddress.complement || "",
          code_postal: selectedAddress.code_postal || "",
          ville: selectedAddress.ville || "",
          gouvernorat: selectedAddress.gouvernorat || "",
          telephone: selectedAddress.telephone || "",
        })
        setFormErrors({
          adresse: "",
          code_postal: "",
          gouvernorat: "",
          telephone: "",
        })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      sessionStorage.setItem("saved_address", JSON.stringify(formData))

      const result = await sauvegarderAdresseLivraison({
        ...formData,
        est_principale: selectedAddressId ? 
          clientAddresses.find(addr => addr.id === selectedAddressId)?.est_principale || false : 
          false,
        nom_adresse: selectedAddressId ? 
          clientAddresses.find(addr => addr.id === selectedAddressId)?.nom_adresse || "Adresse" : 
          "Adresse",
      })
      
      if (result) {
        sessionStorage.setItem("current_address_id", result.adresse_id)
        sessionStorage.removeItem("saved_address")
        router.push(result.etapeSuivante || "/caisse/livraison")
      }
    } catch (error) {
      console.error("Address save error:", error)
      toast.error(error.message || "Erreur lors de la sauvegarde de l'adresse")
    }
  }

  const handlePrevious = () => {
    router.back()
  }

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 gap-6 py-6 sm:py-8">
      <div className="w-full lg:flex-1 lg:max-w-2xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Adresse de Livraison</h2>

          {clientAddresses.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium mb-1">Sélectionner une adresse existante</label>
              <Select 
                value={selectedAddressId} 
                onValueChange={handleAddressSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une adresse enregistrée" />
                </SelectTrigger>
                <SelectContent>
                  {clientAddresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      {address.est_principale ? "⭐ " : ""}
                      {address.nom_adresse || "Adresse"} - {address.adresse.substring(0, 30)}...
                      {address.est_principale ? " (Principale)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium mb-1">Adresse *</label>
              <div className="relative">
                <Input
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className={`w-full ${formErrors.adresse ? "border-red-500" : ""}`}
                  placeholder="Commencez à taper votre adresse..."
                  onClick={(e) => e.stopPropagation()}
                />
                {isLoading && (
                  <div className="absolute right-3 top-3 animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                )}
              </div>
              {formErrors.adresse && <p className="text-red-500 text-xs mt-1">{formErrors.adresse}</p>}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      {suggestion.Cite}, {suggestion.Deleg} ({suggestion.zip})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Complément d&apos;adresse</label>
              <Input
                name="complement"
                value={formData.complement}
                onChange={handleChange}
                className="w-full"
                placeholder="Appartement, étage, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Gouvernorat *</label>
                <Input
                  name="gouvernorat"
                  value={formData.gouvernorat}
                  onChange={handleChange}
                  className={`w-full ${formErrors.gouvernorat ? "border-red-500" : ""}`}
                />
                {formErrors.gouvernorat && <p className="text-red-500 text-xs mt-1">{formErrors.gouvernorat}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Code Postal *</label>
                <Input
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  className={`w-full ${formErrors.code_postal ? "border-red-500" : ""}`}
                />
                {formErrors.code_postal && <p className="text-red-500 text-xs mt-1">{formErrors.code_postal}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Téléphone *</label>
              <Input
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className={`w-full ${formErrors.telephone ? "border-red-500" : ""}`}
                placeholder="12345678"
              />
              {formErrors.telephone && <p className="text-red-500 text-xs mt-1">{formErrors.telephone}</p>}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="w-full sm:w-auto text-xs sm:text-sm rounded-none border border-black"
                type="button"
                disabled={chargement}
              >
                Étape précédente
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto text-xs sm:text-sm rounded-none bg-black text-white border border-black hover:bg-white hover:text-black"
                disabled={chargement}
              >
                {chargement ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-80">
        <ResumeCommande showPromoCode={false} showCheckoutButton={false} />
      </div>
    </div>
  )
}