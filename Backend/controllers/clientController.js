const { Client, Utilisateur } = require("../models");

const mettreAJourClient = async (req, res) => {
  try {
    const utilisateurId = req.session.utilisateur?.id;
    if (!utilisateurId) {
      return res.status(401).json({ message: "Non authentifié. Veuillez vous connecter." });
    }

    const {
      telephone,
      adresse_expedition,
      adresse_facturation,
      points_fidelite,
      newsletter,
      methode_paiement
    } = req.body;

    const client = await Client.findOne({ where: { utilisateur_id: utilisateurId } });
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    await client.update({
      telephone: telephone || client.telephone,
      adresse_expedition: adresse_expedition || client.adresse_expedition,
      adresse_facturation: adresse_facturation || client.adresse_facturation,
      points_fidelite: points_fidelite || client.points_fidelite,
      newsletter: newsletter !== undefined ? newsletter : client.newsletter,
      methode_paiement: methode_paiement || client.methode_paiement
    });

    res.json({ message: "Profil client mis à jour avec succès", client });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du client", error: error.message });
  }
};

const obtenirHistoriqueCommandes = async (req, res) => {
  try {
    const utilisateurId = req.session.utilisateur?.id;
    if (!utilisateurId) {
      return res.status(401).json({ message: "Non authentifié. Veuillez vous connecter." });
    }

    const client = await Client.findOne({ 
      where: { utilisateur_id: utilisateurId },
      include: [{ model: Commande, as: 'commandes' }]
    });

    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    res.json({ commandes: client.commandes });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique", error: error.message });
  }
};

module.exports = {
  mettreAJourClient,
  obtenirHistoriqueCommandes,
};