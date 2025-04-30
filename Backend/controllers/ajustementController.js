const { Article, Taille, ArticleTaille, AjustementStock, Utilisateur } = require("../models");
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const ajusterStock = async (req, res) => {
  try {
    const { article_id, taille_id, quantite, raison, raison_autre, type = 'adjustment' } = req.body;
    const admin_id = req.utilisateur?.id;

    if (!req.utilisateur || !['admin', 'super_admin'].includes(req.utilisateur?.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès refusé : droits insuffisants" 
      });
    }

    if (raison === 'Autre' && (!raison_autre || raison_autre.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une raison personnalisée"
      });
    }

    const articleTaille = await ArticleTaille.findOne({ 
      where: { article_id, taille_id },
      include: [
        { model: Article, as: 'article', attributes: ['id', 'nom_produit'] },
        { model: Taille, as: 'taille', attributes: ['id', 'libelle'] }
      ]
    });

    if (!articleTaille) {
      return res.status(404).json({ 
        success: false, 
        message: "Association article-taille non trouvée" 
      });
    }

    const quantiteAvant = articleTaille.quantite;
    let quantiteApres, difference;

    if (type === 'correction') {
      quantiteApres = parseInt(quantite);
      difference = quantiteApres - quantiteAvant;
    } else {
      difference = parseInt(quantite);
      quantiteApres = quantiteAvant + difference;
    }

    if (quantiteApres < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "La quantité ne peut pas être négative" 
      });
    }

    await articleTaille.update({ quantite: quantiteApres });
    const ajustement = await AjustementStock.create({
      article_id,
      taille_id,
      quantite_avant: quantiteAvant,
      quantite_apres: quantiteApres,
      difference,
      raison,
      raison_autre: raison === 'Autre' ? raison_autre : null,
      type,
      admin_id
    });

    res.json({ 
      success: true, 
      message: "Ajustement effectué",
      data: {
        ajustement,
        currentStock: quantiteApres,
        taille: articleTaille.taille.libelle
      }
    });

  } catch (error) {
    console.error('Erreur ajustement stock:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

const ajusterStockMultiple = async (req, res) => {
  try {
    const { adjustments } = req.body;
    const admin_id = req.utilisateur?.id;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun ajustement fourni"
      });
    }

    for (const adj of adjustments) {
      if (adj.raison === 'Autre' && (!adj.raison_autre || adj.raison_autre.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: "Veuillez fournir une raison personnalisée pour tous les ajustements marqués 'Autre'"
        });
      }
    }

    const results = [];
    
    for (const adj of adjustments) {
      try {
        const { article_id, taille_id, quantite, raison, raison_autre, type } = adj;
        
        if (!article_id || !taille_id || quantite === undefined || !raison) {
          results.push({
            success: false,
            message: `Champs manquants pour l'ajustement (article: ${article_id}, taille: ${taille_id})`
          });
          continue;
        }

        const articleTaille = await ArticleTaille.findOne({ 
          where: { article_id, taille_id },
          include: [
            { model: Article, as: 'article' },
            { model: Taille, as: 'taille' }
          ]
        });

        if (!articleTaille) {
          results.push({
            success: false,
            message: `Combinaison article/taille introuvable (article: ${article_id}, taille: ${taille_id})`
          });
          continue;
        }

        let newQuantity;
        if (type === 'correction') {
          newQuantity = parseInt(quantite);
        } else {
          newQuantity = articleTaille.quantite + parseInt(quantite);
        }

        if (newQuantity < 0) {
          results.push({
            success: false,
            message: `Stock négatif non autorisé (article: ${article_id}, taille: ${taille_id})`
          });
          continue;
        }

        await articleTaille.update({ quantite: newQuantity });

        await AjustementStock.create({
          article_id,
          taille_id,
          quantite_avant: articleTaille.quantite,
          quantite_apres: newQuantity,
          difference: newQuantity - articleTaille.quantite,
          raison,
          raison_autre: raison === 'Autre' ? raison_autre : null,
          type,
          admin_id
        });

        results.push({
          success: true,
          message: `Ajustement réussi (article: ${article_id}, taille: ${taille_id})`
        });
      } catch (error) {
        console.error('Error processing adjustment:', error);
        results.push({
          success: false,
          message: `Erreur lors du traitement (${error.message})`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `${successCount}/${adjustments.length} ajustement(s) effectué(s) avec succès`,
      results
    });
  } catch (error) {
    console.error('Error in bulk adjustment:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors des ajustements groupés"
    });
  }
};



const obtenirHistoriqueAjustements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      date,
      type,
      admin_id
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { '$article.nom_produit$': { [Op.iLike]: `%${search}%` } },
        { '$article.sku$': { [Op.iLike]: `%${search}%` } },
        sequelize.where(
          sequelize.cast(sequelize.col('AjustementStock.raison'), 'TEXT'),
          { [Op.iLike]: `%${search}%` }
        ),
        { raison_autre: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type && type !== 'all') where.type = type;
    if (admin_id) where.admin_id = admin_id;

    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    const { count, rows } = await AjustementStock.findAndCountAll({
      where,
      include: [
        {
          model: Article,
          as: 'article',
          attributes: ['id', 'nom_produit', 'sku']
        },
        {
          model: Taille,
          as: 'taille',
          attributes: ['id', 'libelle']
        },
        {
          model: Utilisateur,
          as: 'admin',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    const transformedData = rows.map(record => {
      const plainRecord = record.get({ plain: true });
      return {
        ...plainRecord,
        raison: plainRecord.raison === 'Autre' ? plainRecord.raison_autre : plainRecord.raison
      };
    });

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching adjustment history:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique des ajustements",
      error: error.message
    });
  }
};


module.exports = {
  ajusterStock,
  obtenirHistoriqueAjustements,
  ajusterStockMultiple,
};