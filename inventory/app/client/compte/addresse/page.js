"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit, Trash2, Home, Briefcase, MapPin, Loader2 } from "lucide-react"
import { useClient } from "@/hooks/useClient"

export default function Adresse() {
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
    type: "home",
    isDefault: false,
    adresse: "",
    complement: "",
    ville: "",
    gouvernorat: "",
    code_postal: "",
    telephone: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load addresses on component mount
  useEffect(() => {
    fetchAddresses()
  }, [])

  // Handle API errors
  useEffect(() => {
    if (apiError) {
      toast.error(apiError)
    }
  }, [apiError])

  const fetchAddresses = async () => {
    setIsLoading(true)
    const { success, data } = await getAddresses()
    if (success) {
      // Transform backend data to match frontend structure
      const transformed = data.adresses.map(addr => ({
        id: addr.id,
        type: addr.nom_adresse.toLowerCase().includes('travail') ? 'work' : 'home',
        isDefault: addr.est_principale,
        adresse: addr.adresse,
        complement: addr.complement,
        ville: addr.ville,
        gouvernorat: addr.gouvernorat,
        code_postal: addr.code_postal,
        telephone: addr.telephone
      }))
      setAddresses(transformed)
    }
    setIsLoading(false)
  }

  const handleEdit = (address) => {
    setFormData({ 
      ...address
    })
    setEditingAddress(address.id)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) {
      const { success } = await deleteAddress(id)
      if (success) {
        toast.success("Adresse supprimée avec succès")
        await fetchAddresses()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Validate form
    if (!formData.adresse || !formData.ville || !formData.code_postal || !formData.telephone) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      setIsLoading(false)
      return
    }

    // Prepare data for backend
    const addressData = {
      nom_adresse: formData.type === 'home' ? 'Domicile' : 'Travail',
      adresse: formData.adresse,
      complement: formData.complement,
      code_postal: formData.code_postal,
      ville: formData.ville,
      gouvernorat: formData.gouvernorat,
      telephone: formData.telephone,
      est_principale: formData.isDefault
    }

    try {
      // Update existing address
      const { success } = await updateAddress(editingAddress, addressData)
      if (success) {
        toast.success("Adresse mise à jour avec succès")
        setEditingAddress(null)
        await fetchAddresses()
      }
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

  const handleSetDefault = async (id) => {
    setIsLoading(true)
    try {
      const { success } = await markAddressAsPrimary(id)
      if (success) {
        toast.success("Adresse par défaut mise à jour")
        await fetchAddresses()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1">Mon carnet d&apos;adresses</h2>
          <p className="text-sm text-gray-600">Gérez vos adresses de livraison et de facturation.</p>
        </div>
      </div>

      {isLoading && !editingAddress ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : editingAddress ? (
        <div className="border border-gray-200 rounded-sm p-4 md:p-6 mb-6">
          <h3 className="text-md font-medium mb-4">Modifier l&apos;adresse</h3>

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
                    disabled={addresses.length === 0}
                  />
                  <span className="text-sm">Définir comme adresse par défaut</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="adresse" className="block text-sm font-medium mb-1">
                Adresse *
              </label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="complement" className="block text-sm font-medium mb-1">
                Complément d&apos;adresse
              </label>
              <input
                type="text"
                id="complement"
                name="complement"
                value={formData.complement}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-sm text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ville" className="block text-sm font-medium mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="gouvernorat" className="block text-sm font-medium mb-1">
                  Gouvernorat *
                </label>
                <input
                  type="text"
                  id="gouvernorat"
                  name="gouvernorat"
                  value={formData.gouvernorat}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="code_postal" className="block text-sm font-medium mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  id="code_postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-sm text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="telephone" className="block text-sm font-medium mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
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
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                {isLoading ? "Enregistrement..." : "Mettre à jour"}
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-sm p-4 relative">
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
                <p>{address.adresse}</p>
                {address.complement && <p>{address.complement}</p>}
                <p>
                  {address.code_postal} {address.ville}, {address.gouvernorat}
                </p>
                <p className="pt-1">{address.telephone}</p>
              </div>

              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800"
                >
                  Définir comme adresse par défaut
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!editingAddress && addresses.length > 0 && (
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