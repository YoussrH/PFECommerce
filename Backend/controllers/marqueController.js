const db = require('../models');
const Marque = db.Marque;
const Article = db.Article;
const Categorie = db.Categorie;
const Genre = db.Genre;
const ImageArticleCouleur = db.ImageArticleCouleur;
const sequelize = db.sequelize;
const ajouterMarque = async (req, res) => {
  try {
    if (!req.body.libelle) {
      return res.status(400).send({
        message: "Le libellé de la marque ne peut pas être vide"
      });
    }

    const marque = {
      libelle: req.body.libelle
    };

    const marqueCree = await Marque.create(marque);
    res.status(201).send(marqueCree);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la création de la marque."
    });
  }
};

const obtenirToutesLesMarques = async (req, res) => {
  try {
    const marques = await Marque.findAll({
      include: ['articles']
    });
    res.status(200).send(marques);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des marques."
    });
  }
};

const obtenirMarqueParId = async (req, res) => {
  const id = req.params.id;

  try {
    const marque = await Marque.findByPk(id, {
      include: ['articles']
    });

    if (marque) {
      res.status(200).send(marque);
    } else {
      res.status(404).send({
        message: `Marque non trouvée avec l'id=${id}`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Erreur lors de la récupération de la marque avec l'id=${id}`
    });
  }
};

const mettreAJourMarque = async (req, res) => {
  const id = req.params.id;

  try {
    const [nombreLignesAffectees] = await Marque.update(req.body, {
      where: { id: id }
    });

    if (nombreLignesAffectees === 1) {
      res.status(200).send({
        message: "La marque a été mise à jour avec succès."
      });
    } else {
      res.status(404).send({
        message: `Impossible de mettre à jour la marque avec l'id=${id}. La marque n'a pas été trouvée ou les données sont les mêmes.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Erreur lors de la mise à jour de la marque avec l'id=${id}`
    });
  }
};

const supprimerMarque = async (req, res) => {
  const id = req.params.id;

  try {
    const nombreLignesSupprimees = await Marque.destroy({
      where: { id: id }
    });

    if (nombreLignesSupprimees === 1) {
      const result = await db.sequelize.query(
        'SELECT setval(pg_get_serial_sequence(\'marque\', \'id\'), coalesce(max(id), 0) + 1, false) FROM marque'
      );
      
      res.status(200).send({
        message: "La marque a été supprimée avec succès!"
      });
    } else {
      res.status(404).send({
        message: `Impossible de supprimer la marque avec l'id=${id}. La marque n'a pas été trouvée.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Impossible de supprimer la marque avec l'id=${id}`
    });
  }
};

const supprimerToutesLesMarques = async (req, res) => {
  try {
    const nombreMarquesSupprimees = await Marque.destroy({
      where: {},
      truncate: false
    });

    res.status(200).send({
      message: `${nombreMarquesSupprimees} marques ont été supprimées avec succès!`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la suppression de toutes les marques."
    });
  }
};

/* // In marqueController.js, replace the popular marques query with:
const obtenirMarquesPopulaires = async (req, res) => {
  try {
    // Use raw query for better performance and PostgreSQL compatibility
    const marques = await sequelize.query(`
      SELECT 
        m.id,
        m.libelle,
        COUNT(a.id) as "article_count",
        (
          SELECT iac.image_url 
          FROM image_article_couleur iac
          JOIN article a2 ON a2.id = iac.article_id
          WHERE a2.marque_id = m.id
          LIMIT 1
        ) as "featured_image"
      FROM marque m
      JOIN article a ON a.marque_id = m.id
      JOIN image_article_couleur iac ON iac.article_id = a.id
      GROUP BY m.id
      HAVING COUNT(a.id) > 0
      ORDER BY COUNT(a.id) DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: marques
    });
  } catch (error) {
    console.error("Error getting popular marques:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching popular marques",
      error: error.message
    });
  }
};
const obtenirMarquesParGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    // First try to find genre by ID, then by name if not found
    const genreRecord = await sequelize.query(`
      SELECT id, libelle FROM genre 
      WHERE id = :genre OR libelle ILIKE :genreLike
      LIMIT 1
    `, {
      replacements: { 
        genre: isNaN(genre) ? null : parseInt(genre),
        genreLike: `%${genre}%` 
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (!genreRecord || genreRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Genre non trouvé"
      });
    }

    const marques = await sequelize.query(`
      SELECT 
        m.id,
        m.libelle,
        (
          SELECT iac.image_url 
          FROM image_article_couleur iac
          JOIN article a2 ON a2.id = iac.article_id
          WHERE a2.marque_id = m.id AND a2.genre_id = :genreId
          LIMIT 1
        ) as "featured_image"
      FROM marque m
      JOIN article a ON a.marque_id = m.id
      WHERE a.genre_id = :genreId
      AND (
        SELECT COALESCE(SUM(quantite), 0)
        FROM article_taille
        WHERE article_taille.article_id = a.id
      ) > 0
      GROUP BY m.id
      ORDER BY m.libelle ASC
    `, {
      replacements: { genreId: genreRecord[0].id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        genre: genreRecord[0],
        marques: marques
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des marques par genre:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des marques",
      error: error.message
    });
  }
}; */

// Remove the obtenirMarquesAvecArticleAleatoire function completely
// Keep only the following functions:
const obtenirMarquesPopulaires = async (req, res) => {
  try {
    const marques = await sequelize.query(`
      SELECT 
        m.id,
        m.libelle,
        COUNT(a.id) as "article_count",
        (
          SELECT iac.image_url 
          FROM image_article_couleur iac
          WHERE iac.article_id = a.id
          LIMIT 1
        ) as "featured_image"
      FROM marque m
      JOIN article a ON a.marque_id = m.id
      WHERE EXISTS (
        SELECT 1 FROM article_taille at
        WHERE at.article_id = a.id
        AND at.quantite > 0
      )
      GROUP BY m.id, a.id
      HAVING COUNT(a.id) > 0
      ORDER BY COUNT(a.id) DESC
      LIMIT 12
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json(marques);
  } catch (error) {
    console.error("Error getting popular marques:", error);
    res.status(500).json({
      message: "Error fetching popular marques",
      error: error.message
    });
  }
};

const obtenirMarquesParGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    const genreRecord = await sequelize.query(`
      SELECT id, libelle FROM genre 
      WHERE id = :genre OR libelle ILIKE :genreLike
      LIMIT 1
    `, {
      replacements: { 
        genre: isNaN(genre) ? null : parseInt(genre),
        genreLike: `%${genre}%` 
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (!genreRecord || genreRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Genre non trouvé"
      });
    }

    const marques = await sequelize.query(`
      SELECT 
        m.id,
        m.libelle,
        (
          SELECT iac.image_url 
          FROM image_article_couleur iac
          JOIN article a2 ON a2.id = iac.article_id
          WHERE a2.marque_id = m.id AND a2.genre_id = :genreId
          LIMIT 1
        ) as "featured_image"
      FROM marque m
      JOIN article a ON a.marque_id = m.id
      WHERE a.genre_id = :genreId
      AND (
        SELECT COALESCE(SUM(quantite), 0)
        FROM article_taille
        WHERE article_taille.article_id = a.id
      ) > 0
      GROUP BY m.id
      ORDER BY m.libelle ASC
    `, {
      replacements: { genreId: genreRecord[0].id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        genre: genreRecord[0],
        marques: marques
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des marques par genre:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des marques",
      error: error.message
    });
  }
};


module.exports = {


  ajouterMarque,
  obtenirToutesLesMarques,
  obtenirMarqueParId,
  mettreAJourMarque,
  supprimerMarque,
  supprimerToutesLesMarques,
  obtenirMarquesPopulaires,
  obtenirMarquesParGenre,
  

};