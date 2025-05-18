// app/admin/remises/verifier/page.jsx
"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRemise } from '@/hooks/useRemise'
import { toast } from 'sonner'

export default function VerifierRemisePage() {
  const [code, setCode] = useState('')
  const [panier, setPanier] = useState([
    { article_id: '', nom: '', prix: 0, quantite: 1, taille_id: '', couleur_id: '', categorie_id: '' }
  ])
  const { verificationResult, verifyRemise, loading } = useRemise()

  const handleAddItem = () => {
    setPanier([...panier, { 
      article_id: '', 
      nom: '', 
      prix: 0, 
      quantite: 1, 
      taille_id: '', 
      couleur_id: '',
      categorie_id: ''
    }])
  }

  const handleRemoveItem = (index) => {
    const newPanier = [...panier]
    newPanier.splice(index, 1)
    setPanier(newPanier)
  }

  const handleItemChange = (index, field, value) => {
    const newPanier = [...panier]
    newPanier[index][field] = value
    setPanier(newPanier)
  }

  const handleVerify = async () => {
    if (!code) {
      toast.error("Veuillez entrer un code promo")
      return
    }

    if (panier.length === 0 || panier.some(item => !item.article_id || !item.quantite)) {
      toast.error("Veuillez remplir tous les champs du panier")
      return
    }

    await verifyRemise(code, panier)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Vérificateur de remise</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Entrées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block mb-2">Code promo</label>
              <Input 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Entrez le code promo"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label>Panier</label>
                <Button size="sm" onClick={handleAddItem}>
                  Ajouter un article
                </Button>
              </div>

              <div className="space-y-4">
                {panier.map((item, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">ID Article</label>
                        <Input 
                          value={item.article_id}
                          onChange={(e) => handleItemChange(index, 'article_id', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Nom</label>
                        <Input 
                          value={item.nom}
                          onChange={(e) => handleItemChange(index, 'nom', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Prix</label>
                        <Input 
                          type="number"
                          value={item.prix}
                          onChange={(e) => handleItemChange(index, 'prix', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Quantité</label>
                        <Input 
                          type="number"
                          min="1"
                          value={item.quantite}
                          onChange={(e) => handleItemChange(index, 'quantite', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">ID Catégorie</label>
                        <Input 
                          value={item.categorie_id}
                          onChange={(e) => handleItemChange(index, 'categorie_id', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">ID Taille</label>
                        <Input 
                          value={item.taille_id}
                          onChange={(e) => handleItemChange(index, 'taille_id', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">ID Couleur</label>
                        <Input 
                          value={item.couleur_id}
                          onChange={(e) => handleItemChange(index, 'couleur_id', e.target.value)}
                        />
                      </div>
                    </div>

                    {panier.length > 1 && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemoveItem(index)}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleVerify}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Vérification...' : 'Vérifier la remise'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            {verificationResult ? (
              <div className="space-y-4">
                {verificationResult.error ? (
                  <div className="text-red-500">
                    <p className="font-bold">Erreur:</p>
                    <p>{verificationResult.error}</p>
                    {verificationResult.montant_minimum && (
                      <p>Montant minimum: {verificationResult.montant_minimum} DT</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="border-b pb-4">
                      <h3 className="font-bold text-lg">{verificationResult.remise.nom}</h3>
                      <p>Type: {verificationResult.remise.type === 'pourcentage' ? 
                        `${verificationResult.remise.valeur}%` : 
                        `${verificationResult.remise.valeur} DT`}
                      </p>
                      <p className="text-green-600 font-bold">
                        Montant de la remise: {verificationResult.montant_remise} DT
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Articles éligibles:</h4>
                      <ul className="space-y-2">
                        {verificationResult.articles_eligibles.map((item, index) => (
                          <li key={index} className="border p-2 rounded">
                            <p>{item.nom}</p>
                            <p>Quantité: {item.quantite}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                {loading ? 'Vérification en cours...' : 'Aucun résultat à afficher'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}