const db = require('../models');
const {Marque, Article, ImageArticleCouleur, Taille,Genre,ArticleTaille,Categorie,} = require('../models');
const sequelize = db.sequelize;
const { Op } = require('sequelize');
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



/* const obtenirMarquesPopulaires = async (req, res) => {
  try {
    // Step 1: Get brands with article counts
    const brands = await Marque.findAll({
      attributes: ['id', 'libelle'],
      include: [
        {
          model: Article,
          attributes: [],
          include: [
            {
              model: ArticleTaille,
              where: { quantite: { [Op.gt]: 0 } },
              attributes: []
            }
          ]
        }
      ],
      group: ['Marque.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('articles.id')), 'DESC']],
      limit: 12
    });

    // Step 2: Get featured images
    const brandIds = brands.map(b => b.id);
    const featuredImages = await ImageArticleCouleur.findAll({
      attributes: ['image_url'],
      include: [{
        model: Article,
        attributes: ['marque_id'],
        where: { marque_id: { [Op.in]: brandIds } }
      }],
      group: ['Article.marque_id']
    });

    // Step 3: Combine results
    const result = brands.map(brand => {
      const image = featuredImages.find(img => 
        img.article.marque_id === brand.id
      );
      return {
        id: brand.id,
        libelle: brand.libelle,
        article_count: brand.articles?.length || 0,
        featured_image: image?.image_url || null
      };
    });

    res.status(200).json({
      success: true,
      data: result
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
const obtenirMarquesParGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    // Find genre by ID or name
    const genreRecord = await Genre.findOne({
      where: {
        [Op.or]: [
          isNaN(genre) ? null : { id: parseInt(genre) },
          { libelle: { [Op.iLike]: `%${genre}%` } }
        ]
      }
    });

    if (!genreRecord) {
      return res.status(404).json({
        success: false,
        message: "Genre non trouvé"
      });
    }

    // Get brands with articles in this genre that have inventory
    const marques = await Marque.findAll({
      attributes: ['id', 'libelle'],
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: [],
          where: { 
            genre_id: genreRecord.id,
            '$inventory.quantite$': { [Op.gt]: 0 }
          },
          include: [
            {
              model: ArticleTaille,
              as: 'inventory',
              attributes: [],
              required: true
            }
          ],
          required: true
        },
        {
          model: Article,
          as: 'articles',
          attributes: [],
          include: [
            {
              model: ImageArticleCouleur,
              as: 'images_couleurs',
              attributes: ['image_url'],
              limit: 1,
              separate: true
            }
          ]
        }
      ],
      group: ['Marque.id'],
      order: [['libelle', 'ASC']]
    });

    // Format the response
    const formattedMarques = marques.map(marque => ({
      id: marque.id,
      libelle: marque.libelle,
      featured_image: marque.articles[0]?.images_couleurs[0]?.image_url || null
    }));

    res.json({
      success: true,
      data: {
        genre: genreRecord,
        marques: formattedMarques
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
const obtenirMarquesPopulaires = async (req, res) => {
  try {
    // Step 1: Get brands with article counts
    const brands = await Marque.findAll({
      attributes: [
        'id',
        'libelle',
        [sequelize.fn('COUNT', sequelize.col('articles.id')), 'article_count']
      ],
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: [],
          required: true,
          include: [
            {
              model: ArticleTaille,
              as: 'inventory',
              attributes: [],
              where: { quantite: { [Op.gt]: 0 } },
              required: true
            }
          ]
        }
      ],
      group: ['Marque.id'],
      order: [[sequelize.literal('article_count'), 'DESC']],
      limit: 12,
      subQuery: false
    });

    // Step 2: Get featured images for each brand
    const brandIds = brands.map(brand => brand.id);
    const featuredImages = await ImageArticleCouleur.findAll({
      attributes: [
        'image_url',
        [sequelize.col('article.marque_id'), 'marque_id']
      ],
      include: [
        {
          model: Article,
          as: 'article',
          attributes: [],
          where: { marque_id: { [Op.in]: brandIds } }
        }
      ],
      // Use DISTINCT ON instead of GROUP BY for PostgreSQL
      order: [
        [sequelize.col('article.marque_id'), 'ASC'],
        ['id', 'ASC'] // You might want to order by something more meaningful
      ],
      raw: true
    });

    // For PostgreSQL, we need to manually filter to get one image per brand
    const uniqueImages = {};
    featuredImages.forEach(img => {
      if (!uniqueImages[img.marque_id]) {
        uniqueImages[img.marque_id] = img.image_url;
      }
    });

    // Step 3: Combine results
    const result = brands.map(brand => ({
      id: brand.id,
      libelle: brand.libelle,
      article_count: brand.get('article_count'),
      featured_image: uniqueImages[brand.id] || null
    }));

    res.status(200).json({
      success: true,
      data: result
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
const obtenirArticlesParMarque = async (req, res) => {
  try {
    const { id } = req.params;

    const marque = await Marque.findByPk(id);
    if (!marque) {
      return res.status(404).json({
        success: false,
        message: "Marque non trouvée"
      });
    }

    const articles = await Article.findAll({
      where: { marque_id: id },
      include: [
        {
          model: ArticleTaille,
          as: 'inventory',
          attributes: [],
          where: { quantite: { [Op.gt]: 0 } },
          required: true
        },
        {
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite'],
            as: 'ArticleTaille'
          }
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          attributes: ['image_url']
        },
        {
          model: Marque,
          as: 'marque',
          attributes: ['id', 'libelle']
        },
        {
          model: Genre,
          as: 'genre',
          attributes: ['id', 'libelle']
        },
        {
          model: Categorie,
          as: 'categorie',
          attributes: ['id', 'libelle']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedArticles = articles.map(article => ({
      id: article.id,
      nom_produit: article.nom_produit,
      description: article.description,
      prix: article.prix,
      prix_final: article.prix_final,
      images: article.images_couleurs.map(img => img.image_url),
      images_couleurs: article.images_couleurs,
      tailles: article.tailles.map(t => ({
        id: t.id,
        libelle: t.libelle,
        quantite: t.ArticleTaille.quantite
      })),
      marque: article.marque,
      genre: article.genre,
      categorie: article.categorie,
      created_at: article.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        marque,
        articles: formattedArticles
      }
    });
  } catch (error) {
    console.error("Error getting articles by marque:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching articles by marque",
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
  obtenirArticlesParMarque
  

};