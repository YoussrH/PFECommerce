const { Categorie } = require("../models");
const db = require("../config/db");
const { Sequelize } = require("sequelize"); 


const obtenirToutesCategories = async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      include: [
        { 
          model: Categorie, 
          as: "parent", 
          attributes: ["id", "libelle"] 
        },
        { 
          model: Categorie, 
          as: "sous_categories",
        },
      ],
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const obtenirCategorieParId = async (req, res) => {
  try {
    const categorieId = req.params.id;
    const categorie = await Categorie.findByPk(categorieId, {
      include: [
        { model: Categorie, as: "parent", attributes: ["id", "libelle"] },
      ],
    });

    if (!categorie) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json(categorie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const mettreAJourCategorie = async (req, res) => {
  try {
    const { libelle, parent_id } = req.body;
    const categorie = await Categorie.findByPk(req.params.id);
    if (!categorie) return res.status(404).json({ error: "Catégorie non trouvée" });

    await categorie.update({ libelle, parent_id: parent_id || null });
    res.json(categorie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const supprimerCategorie = async (req, res) => {
  const id = req.params.id;

  try {
    const categorie = await Categorie.findByPk(id);
    if (!categorie) {
      return res.status(404).json({ 
        error: `Catégorie avec l'id=${id} non trouvée` 
      });
    }

    await categorie.destroy();

    await db.query(
      `SELECT setval(pg_get_serial_sequence('categorie', 'id'), (SELECT MAX(id) FROM categorie))`
    );

    res.status(200).json({ 
      message: "Catégorie supprimée avec succès" 
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression de la catégorie",
      details: error.message 
    });
  }
};
const ajouterCategorie = async (req, res) => {
  try {
    const { libelle, parent_id } = req.body;
    
    if (!libelle || typeof libelle !== 'string' || libelle.trim() === '') {
      return res.status(400).json({ error: "Le libellé est obligatoire et doit être une chaîne valide" });
    }

    const normalizedLibelle = libelle.trim().toLowerCase();

    const existingCategory = await Categorie.findOne({
      where: db.where(
        db.fn('lower', db.col('libelle')),
        normalizedLibelle
      )
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: `Une catégorie avec ce libellé existe déjà (ID: ${existingCategory.id})`,
        existingId: existingCategory.id,
        existingLibelle: existingCategory.libelle
      });
    }

    if (parent_id) {
      const parent = await Categorie.findByPk(parent_id);
      if (!parent) {
        return res.status(400).json({ error: "La catégorie parente spécifiée n'existe pas" });
      }
    }

        

    
        const categorie = await Categorie.create({ 
          libelle: libelle.trim(),
          parent_id: parent_id || null 
        });
    
        res.status(201).json(categorie);
        
      } catch (error) {
        console.error("Error in ajouterCategorie:", error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
          if (error.fields && error.fields.id) {
            try {
              await db.query(
                `SELECT setval(pg_get_serial_sequence('categorie', 'id'), (SELECT MAX(id) FROM categorie))`
              );
              return ajouterCategorie(req, res);
            } catch (seqError) {
              console.error("Error resetting sequence:", seqError);
              return res.status(500).json({ 
                error: "Erreur serveur lors de la réinitialisation de la séquence",
                details: seqError.message 
              });
            }
          }
          return res.status(400).json({ 
            error: "Erreur de contrainte unique",
            details: error.errors.map(err => err.message)
          });
        }
        
        res.status(500).json({ 
          error: "Erreur serveur lors de la création de la catégorie",
          details: error.message 
        });
      }
    
};

const obtenirCategoriesHierarchiques = async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      where: { parent_id: null },
      include: [{
        model: Categorie,
        as: 'sous_categories',
        include: [{ 
          model: Categorie,
          as: 'sous_categories',
        }]
      }]    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  ajouterCategorie,
  obtenirToutesCategories,
  obtenirCategorieParId,
  mettreAJourCategorie,
  supprimerCategorie,
  obtenirCategoriesHierarchiques
};