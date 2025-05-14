"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit, Trash2, Home, Briefcase, MapPin } from "lucide-react"
import { useClient } from "@/hooks/useClient"

export default function Addresses() {
  const { 
    getAddresses, 
    markAddressAsPrimary, 
    updateAddress,
    deleteAddress,
    loading: apiLoading,
    error: apiError
  } = useClient()

  const [addresses, setAddresses] = useState([])
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    nom_adresse: "",
    adresse: "",
    complement: "",
    ville: "",
    code_postal: "",
    gouvernorat: "",
    telephone: "",
    est_principale: false
  })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    setIsLoading(true)
    try {
      const result = await getAddresses()
      if (result.success) {
        // Use the est_principale flag directly from backend
        setAddresses(result.data.adresses)
      } else if (apiError) {
        toast.error(apiError)
      }
    } catch (error) {
      toast.error("Failed to load addresses")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (address) => {
    setFormData({ 
      nom_adresse: address.nom_adresse.replace('Principale', '').trim(),
      adresse: address.adresse,
      complement: address.complement,
      ville: address.ville,
      code_postal: address.code_postal,
      gouvernorat: address.gouvernorat,
      telephone: address.telephone,
      est_principale: address.est_principale
    })
    setEditingAddress(address.id)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      setIsLoading(true)
      try {
        const result = await deleteAddress(id)
        if (result.success) {
          await fetchAddresses()
          toast.success("Address deleted successfully")
        }
      } catch (error) {
        toast.error("Failed to delete address")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.nom_adresse || !formData.adresse || !formData.ville || !formData.code_postal || !formData.telephone) {
      toast.error("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      const result = await updateAddress(editingAddress, {
        ...formData,
        // Ensure we add "Principale" back if this is the primary address
        nom_adresse: formData.est_principale ? `${formData.nom_adresse} Principale` : formData.nom_adresse
      })
      if (result.success) {
        toast.success("Address updated successfully")
        await fetchAddresses()
        setEditingAddress(null)
      }
    } catch (error) {
      toast.error("Failed to update address")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefault = async (addressId) => {
    setIsLoading(true)
    try {
      const result = await markAddressAsPrimary(addressId)
      if (result.success) {
        toast.success("Primary address updated")
        // Update state to ensure only one address is primary
        setAddresses(prevAddresses => 
          prevAddresses.map(address => ({
            ...address,
            est_principale: address.id === addressId,
            // Update the name to include "Principale" for primary address
            nom_adresse: address.id === addressId 
              ? `${address.nom_adresse.replace('Principale', '').trim()} Principale`
              : address.nom_adresse.replace('Principale', '').trim()
          }))
        )
      }
    } catch (error) {
      toast.error("Failed to update primary address")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingAddress(null)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1">My Addresses</h2>
          <p className="text-sm text-gray-600">Manage your delivery addresses.</p>
        </div>
      </div>

      {editingAddress ? (
        <div className="border border-gray-200 rounded-sm p-4 md:p-6 mb-6">
          <h3 className="text-md font-medium mb-4">Edit Address</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address Name*</label>
                <input
                  type="text"
                  name="nom_adresse"
                  value={formData.nom_adresse}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone*</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address*</label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address Complement</label>
              <input
                type="text"
                name="complement"
                value={formData.complement}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code*</label>
                <input
                  type="text"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City*</label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State*</label>
                <input
                  type="text"
                  name="gouvernorat"
                  value={formData.gouvernorat}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="defaultAddress"
                name="est_principale"
                checked={formData.est_principale}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="defaultAddress" className="text-sm">
                Set as primary address
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <p>Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-sm mb-6">
          <MapPin size={40} className="mx-auto mb-3 text-gray-400" />
          <h3 className="text-md font-medium mb-2">No saved addresses</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your order addresses will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {address.nom_adresse?.includes("Home") ? (
                    <Home size={16} className="text-gray-500" />
                  ) : (
                    <Briefcase size={16} className="text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    {address.est_principale 
                      ? `${address.nom_adresse.replace('Principale', '').trim()} Principale`
                      : address.nom_adresse.replace('Principale', '').trim() || "Address"}
                  </span>
                  {address.est_principale && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-1 text-gray-500 hover:text-black"
                    aria-label="Edit"
                    disabled={apiLoading}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    aria-label="Delete"
                    disabled={address.est_principale || apiLoading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p>{address.adresse}</p>
                {address.complement && <p>{address.complement}</p>}
                <p>
                  {address.code_postal} {address.ville}
                </p>
                <p>{address.gouvernorat}</p>
                <p className="pt-1">{address.telephone}</p>
              </div>

              {!address.est_principale && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="mt-3 text-sm text-black underline hover:no-underline"
                  disabled={apiLoading}
                >
                  Set as primary address
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!editingAddress && addresses.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium mb-3">Address Information</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 pl-2">
            <li>The primary address will be used by default for your orders.</li>
            <li>You cannot delete a primary address.</li>
            <li>Addresses are automatically saved when you place orders.</li>
          </ul>
        </div>
      )}
    </div>
  )
}