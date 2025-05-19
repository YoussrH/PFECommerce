const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Helper functions for discount calculation
  const calculateDiscountValue = (discount, originalPrice) => {
    if (!discount) return 0;
    
    switch (discount.type_remise) {
      case 'pourcentage':
        return originalPrice * (discount.valeur / 100);
      case 'montant_fixe':
        return discount.valeur;
      case 'bogo':
        return originalPrice * 0.5;
      default:
        return 0;
    }
  };

  const calculateFinalPrice = (originalPrice, discount) => {
    if (!discount) return originalPrice;
    
    switch (discount.type_remise) {
      case 'pourcentage':
        return originalPrice * (1 - discount.valeur / 100);
      case 'montant_fixe':
        return Math.max(0, originalPrice - discount.valeur);
      case 'bogo':
        return originalPrice * 0.5;
      default:
        return originalPrice;
    }
  };

  const Article = sequelize.define('Article', {
    nom_produit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le nom du produit est requis' },
        len: { args: [2, 255], msg: 'Le nom doit contenir entre 2 et 255 caractères' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 2000], msg: 'La description ne peut pas dépasser 2000 caractères' }
      }
    },
    conseils: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 2000], msg: 'Les conseils ne peuvent pas dépasser 2000 caractères' }
      }
    },
    prix: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: { msg: 'Le prix doit être un nombre décimal' },
        min: { args: [0], msg: 'Le prix ne peut pas être négatif' }
      }
    },
    prix_final: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        isFloat: { msg: 'Le prix final doit être un nombre décimal' },
        min: { args: [0], msg: 'Le prix final ne peut pas être négatif' }
      }
    },
    sku: {
      type: DataTypes.STRING,
      unique: { msg: 'Ce SKU existe déjà' },
      validate: {
        len: { args: [3, 50], msg: 'Le SKU doit contenir entre 3 et 50 caractères' }
      }
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    est_nouveau: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    est_meilleur_vente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'L\'ID de catégorie doit être un entier' }
      }
    },
    marque_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'L\'ID de marque doit être un entier' }
      }
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'L\'ID de genre doit être un entier' }
      }
    }
  }, {
    tableName: 'article',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['sku'] },
      { fields: ['categorie_id'] },
      { fields: ['marque_id'] },
      { fields: ['genre_id'] },
      { fields: ['est_actif'] },
      { fields: ['est_nouveau'] },
      { fields: ['est_meilleur_vente'] }
    ],
    scopes: {
      actifs: { where: { est_actif: true } },
      nouveaux: { where: { est_nouveau: true } },
      meilleursVentes: { where: { est_meilleur_vente: true } },
      avecQuantiteTotale: {
        attributes: {
          include: [
            [sequelize.literal(`(
              SELECT COALESCE(SUM(quantite), 0)
              FROM article_taille
              WHERE article_taille.article_id = "Article".id
                AND article_taille.deleted_at IS NULL
            )`), 'quantite_totale']
          ]
        }
      },
      avecRemises: {
        include: [{
          model: sequelize.models.Remise,
          as: 'article_discounts',
          where: {
            est_active: true,
            date_debut: { [Op.lte]: sequelize.literal('CURRENT_TIMESTAMP') },
            date_fin: { [Op.gte]: sequelize.literal('CURRENT_TIMESTAMP') }
          },
          required: false
        }]
      },
      avecDetails: {
        include: [
          { model: sequelize.models.Categorie, as: 'categorie' },
          { model: sequelize.models.Marque, as: 'marque' },
          { model: sequelize.models.Genre, as: 'genre' },
          { 
            model: sequelize.models.ArticleTaille, 
            as: 'inventory',
            include: [
              { model: sequelize.models.Taille, as: 'taille' },
              { model: sequelize.models.Couleur, as: 'couleur' }
            ]
          },
          { 
            model: sequelize.models.ImageArticleCouleur,
            as: 'images_couleurs',
            include: [
              { model: sequelize.models.Couleur, as: 'couleur' }
            ]
          }
        ]
      }
    },
    hooks: {
      beforeValidate: (article) => {
        if (article.prix_final === null || article.prix_final === undefined) {
          article.prix_final = article.prix;
        }
      },
      beforeSave: async (article) => {
        article.updated_at = new Date();
        if (article.prix_final > article.prix) {
          article.prix_final = article.prix;
        }
      },
afterFind: async (articles, options) => {
  if (!articles) return;
  
  const isArray = Array.isArray(articles);
  if (!isArray) articles = [articles];
  
  const currentDate = new Date();
  
  for (const article of articles) {
    // Skip if we already have a custom price that's different from base price
    if (article.prix_final !== article.prix && article.prix_final !== 0) continue;
    
    // Only calculate discount if not already loaded with discounts
    if (!options.scope || !options.scope.includes('avecRemises')) {
      const discounts = await sequelize.models.Remise.findAll({
        include: [
          { 
            association: 'discounted_articles', 
            where: { id: article.id },
            required: false 
          },
          { 
            association: 'discounted_categories', 
            where: { id: article.categorie_id },
            required: false 
          },
          { 
            association: 'discounted_marques', 
            where: { id: article.marque_id },
            required: false 
          },
          { 
            association: 'discounted_genres', 
            where: { id: article.genre_id },
            required: false 
          }
        ],
        where: {
          est_active: true,
          date_debut: { [Op.lte]: currentDate },
          date_fin: { [Op.gte]: currentDate }
        }
      });
      
      if (discounts.length > 0) {
        // Find the best applicable discount
        const applicableDiscounts = discounts.filter(d => {
          // Check if discount applies to this specific article
          if (d.apply_to === 'articles' && 
              d.discounted_articles.length === 0) return false;
              
          if (d.apply_to === 'categories' && 
              d.discounted_categories.length === 0) return false;
              
          if (d.apply_to === 'marques' && 
              d.discounted_marques.length === 0) return false;
              
          if (d.apply_to === 'genres' && 
              d.discounted_genres.length === 0) return false;
              
          return true;
        });
        
        if (applicableDiscounts.length > 0) {
          const bestDiscount = applicableDiscounts.reduce((prev, current) => 
            (calculateDiscountValue(prev, article.prix) > calculateDiscountValue(current, article.prix)) 
            ? prev : current
          );
          
          article.prix_final = calculateFinalPrice(article.prix, bestDiscount);
          article.dataValues.remise = bestDiscount;
        } else {
          article.prix_final = article.prix;
        }
      } else {
        article.prix_final = article.prix;
      }
    }
  }
  
  return isArray ? articles : articles[0];
}
    }
  });

  Article.associate = (models) => {
    Article.belongsTo(models.Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
      onDelete: 'RESTRICT'
    });
    
    Article.belongsTo(models.Marque, {
      foreignKey: 'marque_id',
      as: 'marque',
      onDelete: 'RESTRICT'
    });
    
    Article.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
      onDelete: 'RESTRICT'
    });
    
    Article.hasMany(models.ArticleTaille, {
      foreignKey: 'article_id',
      as: 'inventory',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Taille, {
      through: models.ArticleTaille,
      foreignKey: 'article_id',
      as: 'tailles',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Couleur, {
      through: models.ArticleCouleur,
      foreignKey: 'article_id',
      as: 'couleurs',
      onDelete: 'CASCADE'
    });
    
    Article.hasMany(models.ImageArticleCouleur, {
      foreignKey: 'article_id',
      as: 'images_couleurs',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Remise, {
      through: models.RemiseArticle,
      foreignKey: 'article_id',
      as: 'article_discounts',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Panier, {
      through: models.ArticlePanier,
      foreignKey: 'article_id',
      as: 'paniers',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Commande, {
      through: models.CommandeArticle,
      foreignKey: 'article_id',
      as: 'commandes',
      onDelete: 'RESTRICT'
    });
    
    Article.hasMany(models.AjustementStock, {
      foreignKey: 'article_id',
      as: 'ajustements',
      onDelete: 'CASCADE'
    });
    
    Article.hasMany(models.ListeEnvies, {
      foreignKey: 'article_id',
      as: 'dans_liste_envies',
      onDelete: 'CASCADE'
    });
  Article.belongsToMany(models.Remise, {
    through: models.RemiseArticle,
    foreignKey: 'article_id',
    as: 'article_discounts',
    onDelete: 'CASCADE'
  });
  };

  // Class methods
  Article.findBySku = async function(sku, options = {}) {
    return await this.findOne({ where: { sku }, ...options });
  };

  Article.findActifs = function(options = {}) {
    return this.scope('actifs').findAll(options);
  };

  Article.findAvecDetails = function(options = {}) {
    return this.scope('avecDetails').findAll(options);
  };

  Article.findAvecQuantite = function(options = {}) {
    return this.scope('avecQuantiteTotale').findAll(options);
  };

  // Instance methods
  Article.prototype.updateStock = async function(tailleId, couleurId, quantite, transaction) {
    const articleTaille = await sequelize.models.ArticleTaille.findOne({
      where: { article_id: this.id, taille_id: tailleId, couleur_id: couleurId },
      transaction
    });
    
    if (!articleTaille) throw new Error('Combinaison article/taille/couleur non trouvée');
    if (articleTaille.quantite + quantite < 0) throw new Error('Stock insuffisant');
    
    return await articleTaille.update({
      quantite: sequelize.literal(`quantite + ${quantite}`)
    }, { transaction });
  };

  Article.prototype.getStock = async function(tailleId, couleurId) {
    const articleTaille = await sequelize.models.ArticleTaille.findOne({
      where: { article_id: this.id, taille_id: tailleId, couleur_id: couleurId }
    });
    return articleTaille ? articleTaille.quantite : 0;
  };

  Article.prototype.getTotalStock = async function() {
    const result = await sequelize.models.ArticleTaille.findOne({
      where: { article_id: this.id },
      attributes: [[sequelize.fn('SUM', sequelize.col('quantite')), 'total']],
      raw: true
    });
    return result ? result.total || 0 : 0;
  };

  return Article;
};