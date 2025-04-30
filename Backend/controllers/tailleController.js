const { Taille, Categorie, Genre } = require("../models");

const ajouterTaille = async (req, res) => {
  try {
    const { libelle, categorie_id, genre_id } = req.body;

    if (!libelle || !categorie_id || !genre_id) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const categorieExist = await Categorie.findByPk(categorie_id);
    if (!categorieExist) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }

    const genreExist = await Genre.findByPk(genre_id);
    if (!genreExist) {
      return res.status(404).json({ message: "Genre non trouvé" });
    }

    const nouvelleTaille = await Taille.create({
      libelle,
      categorie_id,
      genre_id
    });

    res.status(201).json(nouvelleTaille);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la taille:", error);
    res.status(500).json({ message: "Erreur serveur lors de l'ajout de la taille" });
  }
};


const obtenirToutesTailles = async (req, res) => {
  try {
    const { categorie_id, genre_id } = req.query;
    let conditionWhere = {};
    if (categorie_id) conditionWhere.categorie_id = categorie_id;
    if (genre_id) conditionWhere.genre_id = genre_id;

    const tailles = await Taille.findAll({ where: conditionWhere });
    res.json(tailles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenirTailleParId = async (req, res) => {
  try {
    const { id } = req.params;
    const taille = await Taille.findByPk(id, {
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Genre, as: 'genre' }
      ]
    });

    if (!taille) {
      return res.status(404).json({ message: "Taille non trouvée" });
    }

    res.status(200).json(taille);
  } catch (error) {
    console.error("Erreur lors de la récupération de la taille:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la taille" });
  }
};

const modifierTaille = async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, categorie_id, genre_id } = req.body;

    const taille = await Taille.findByPk(id);
    if (!taille) {
      return res.status(404).json({ message: "Taille non trouvée" });
    }

    if (categorie_id) {
      const categorieExist = await Categorie.findByPk(categorie_id);
      if (!categorieExist) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
    }

    if (genre_id) {
      const genreExist = await Genre.findByPk(genre_id);
      if (!genreExist) {
        return res.status(404).json({ message: "Genre non trouvé" });
      }
    }

    await taille.update({
      libelle: libelle || taille.libelle,
      categorie_id: categorie_id || taille.categorie_id,
      genre_id: genre_id || taille.genre_id
    });

    res.status(200).json(taille);
  } catch (error) {
    console.error("Erreur lors de la modification de la taille:", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification de la taille" });
  }
};

const supprimerTaille = async (req, res) => {
  try {
    const { id } = req.params;

    const taille = await Taille.findByPk(id);
    if (!taille) {
      return res.status(404).json({ message: "Taille non trouvée" });
    }

    await taille.destroy();
    res.status(200).json({ message: "Taille supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la taille:", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la taille" });
  }
};

const listerTaillesParCategorie = async (req, res) => {
  try {
    const { categorie_id } = req.params;
    const tailles = await Taille.findAll({
      where: { categorie_id },
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Genre, as: 'genre' }
      ],
      order: [['libelle', 'ASC']]
    });
    res.status(200).json(tailles);
  } catch (error) {
    console.error("Erreur lors de la récupération des tailles par catégorie:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des tailles par catégorie" });
  }
};

const listerTaillesParGenre = async (req, res) => {
  try {
    const { genre_id } = req.params;
    const tailles = await Taille.findAll({
      where: { genre_id },
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Genre, as: 'genre' }
      ],
      order: [['libelle', 'ASC']]
    });
    res.status(200).json(tailles);
  } catch (error) {
    console.error("Erreur lors de la récupération des tailles par genre:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des tailles par genre" });
  }
};
const ajouterTaillesMultiple = async (req, res) => {
  try {
    const { sizes } = req.body

    if (!sizes || !Array.isArray(sizes)) {
      return res.status(400).json({ message: "Données de tailles invalides" })
    }

    const results = await Promise.all(
      sizes.map(async (size) => {
        try {
          
          if (!size.libelle || !size.genre_id || !size.categorie_id) {
            return { success: false, message: "Tous les champs sont requis" }
          }

         
          const categorieExist = await Categorie.findByPk(size.categorie_id)
          if (!categorieExist) {
            return { success: false, message: "Catégorie non trouvée" }
          }

          const genreExist = await Genre.findByPk(size.genre_id)
          if (!genreExist) {
            return { success: false, message: "Genre non trouvé" }
          }

          const nouvelleTaille = await Taille.create({
            libelle: size.libelle,
            categorie_id: size.categorie_id,
            genre_id: size.genre_id
          })

          return { success: true, taille: nouvelleTaille }
        } catch (error) {
          console.error("Erreur lors de l'ajout de la taille:", error)
          return { success: false, message: error.message }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    res.status(200).json({
      success: true,
      message: `${successCount}/${sizes.length} tailles ajoutées avec succès`,
      results
    })
  } catch (error) {
    console.error("Erreur lors de l'ajout multiple des tailles:", error)
    res.status(500).json({ message: "Erreur serveur lors de l'ajout multiple des tailles" })
  }
}
module.exports = {
  ajouterTaille,
  obtenirToutesTailles,
  obtenirTailleParId,
  modifierTaille,
  supprimerTaille,
  listerTaillesParCategorie,
  listerTaillesParGenre,
  ajouterTaillesMultiple
};