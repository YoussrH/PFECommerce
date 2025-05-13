"use client"
import { useState } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Home, Briefcase, MapPin } from "lucide-react"

export default function Adresse() {
  // Sample addresses data - in a real app, this would come from an API
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: "home",
      isDefault: true,
      firstName: "Jean",
      lastName: "Dupont",
      address1: "123 Rue de Paris",
      address2: "Appartement 4B",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      phone: "01 23 45 67 89",
    },
    {
      id: 2,
      type: "work",
      isDefault: false,
      firstName: "Jean",
      lastName: "Dupont",
      address1: "45 Avenue des Champs-Élysées",
      address2: "Étage 3",
      city: "Paris",
      postalCode: "75008",
      country: "France",
      phone: "01 98 76 54 32",
    },
  ])

  const [editingAddress, setEditingAddress] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    type: "home",
    isDefault: false,
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = (address) => {
    setFormData({ ...address })
    setEditingAddress(address.id)
    setIsAddingNew(false)
  }

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) {
      const updatedAddresses = addresses.filter((address) => address.id !== id)

      // If we're deleting the default address, make the first remaining address the default
      if (addresses.find((a) => a.id === id).isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true
      }

      setAddresses(updatedAddresses)
      toast.success("Adresse supprimée avec succès")
    }
  }

  const handleAddNew = () => {
    setFormData({
      type: "home",
      isDefault: addresses.length === 0, // Make default if it's the first address
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      country: "France",
      phone: "",
    })
    setEditingAddress(null)
    setIsAddingNew(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.address1 || !formData.city || !formData.postalCode) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      setIsLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      if (isAddingNew) {
        // Add new address
        const newAddress = {
          ...formData,
          id: Date.now(),
        }

        // If this is set as default, update other addresses
        if (newAddress.isDefault) {
          setAddresses((prev) =>
            prev
              .map((addr) => ({
                ...addr,
                isDefault: false,
              }))
              .concat(newAddress),
          )
        } else {
          setAddresses((prev) => [...prev, newAddress])
        }

        toast.success("Adresse ajoutée avec succès")
      } else {
        // Update existing address
        setAddresses((prev) => {
          const updated = prev.map((addr) => {
            // If this address is being set as default, unset others
            if (formData.isDefault && addr.id !== editingAddress) {
              return { ...addr, isDefault: false }
            }

            // Update the edited address
            if (addr.id === editingAddress) {
              return { ...formData }
            }

            return addr
          })

          return updated
        })

        toast.success("Adresse mise à jour avec succès")
      }

      setIsAddingNew(false)
      setEditingAddress(null)
      setIsLoading(false)
    }, 1000)
  }

  const handleCancel = () => {
    setIsAddingNew(false)
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
          <h2 className="text-lg md:text-xl font-semibold mb-1">Mon carnet d&apos;adresses</h2>
          <p className="text-sm text-gray-600">Gérez vos adresses de livraison et de facturation.</p>
        </div>

        {!isAddingNew && !editingAddress && (
          <button
            onClick={handleAddNew}
            className="px-3 py-1.5 bg-black text-white text-xs flex items-center gap-1 hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      {isAddingNew || editingAddress ? (
        <div className="border border-gray-200 rounded-sm p-4 md:p-6 mb-6">
          <h3 className="text-md font-medium mb-4">
            {isAddingNew ? "Ajouter une nouvelle adresse" : "Modifier l'adresse"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type d&apos;adresse</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="home"
                      checked={formData.type === "home"}
                      onChange={handleInputChange}
                      className="text-black focus:ring-black"
                    />
                    <span className="text-sm">Domicile</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="work"
                      checked={formData.type === "work"}
                      onChange={handleInputChange}
                      className="text-black focus:ring-black"
                    />
                    <span className="text-sm">Travail</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="text-black focus:ring-black"
                    disabled={addresses.length === 0} // Force default if it's the first address
                  />
                  <span className="text-sm">Définir comme adresse par défaut</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="address1" className="block text-sm font-medium mb-1">
                Adresse *
              </label>
              <input
                type="text"
                id="address1"
                name="address1"
                value={formData.address1}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="address2" className="block text-sm font-medium mb-1">
                Complément d&apos;adresse
              </label>
              <input
                type="text"
                id="address2"
                name="address2"
                value={formData.address2}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                  Pays *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                >
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                required
              />
            </div>

            <p className="text-xs text-gray-500">* Champs obligatoires</p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? "Enregistrement..." : isAddingNew ? "Ajouter" : "Mettre à jour"}
              </button>
            </div>
          </form>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-sm mb-6">
          <MapPin size={40} className="mx-auto mb-3 text-gray-400" />
          <h3 className="text-md font-medium mb-2">Aucune adresse enregistrée</h3>
          <p className="text-sm text-gray-500 mb-4">
            Vous n&apos;avez pas encore ajouté d&apos;adresse à votre compte.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {address.type === "home" ? (
                    <Home size={16} className="text-gray-500" />
                  ) : (
                    <Briefcase size={16} className="text-gray-500" />
                  )}
                  <span className="text-sm font-medium">{address.type === "home" ? "Domicile" : "Travail"}</span>
                  {address.isDefault && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Par défaut</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-1 text-gray-500 hover:text-black"
                    aria-label="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    aria-label="Supprimer"
                    disabled={address.isDefault && addresses.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p className="font-medium">
                  {address.firstName} {address.lastName}
                </p>
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                  {address.postalCode} {address.city}
                </p>
                <p>{address.country}</p>
                <p className="pt-1">{address.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAddingNew && !editingAddress && addresses.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium mb-3">Informations sur les adresses</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 pl-2">
            <li>L&apos;adresse par défaut sera automatiquement sélectionnée lors de vos commandes.</li>
            <li>Vous pouvez ajouter jusqu&apos;à 5 adresses dans votre carnet d&apos;adresses.</li>
            <li>Vos adresses sont utilisées pour la livraison et la facturation de vos commandes.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
