module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    nom_produit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    conseils: DataTypes.TEXT,
    prix: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    prix_final: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    sku: DataTypes.STRING,
    seo_titre: DataTypes.STRING,
    mots_cles_seo: DataTypes.STRING,
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marque_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'article',
    scopes: {
      avecQuantiteTotale: {
        attributes: {
          include: [
            [sequelize.literal(`(
              SELECT COALESCE(SUM(quantite), 0)
              FROM article_taille
              WHERE article_taille.article_id = "Article".id
            )`), 'quantite_totale']
          ]
        }
      }
    }
  });

  Article.associate = (models) => {
    Article.belongsTo(models.Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
    });
    Article.belongsTo(models.Marque, {
      foreignKey: 'marque_id',
      as: 'marque',
    });
    Article.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
    });
    
    // Updated associations for inventory management
    Article.hasMany(models.ArticleTaille, {
      foreignKey: 'article_id',
      as: 'inventory',
      onDelete: 'CASCADE'
    });
    
    Article.belongsToMany(models.Taille, {
      through: models.ArticleTaille,
      foreignKey: 'article_id',
      as: 'tailles',
    });
    
    Article.belongsToMany(models.Couleur, {
      through: models.ArticleCouleur,
      foreignKey: 'article_id',
      as: 'couleurs',
    });
    
    Article.hasMany(models.ImageArticleCouleur, {
      foreignKey: 'article_id',
      as: 'images_couleurs'
    });
    
    // Other associations
    Article.belongsToMany(models.Panier, {
      through: models.ArticlePanier,
      foreignKey: 'article_id',
      as: 'paniers',
    });
    Article.belongsToMany(models.Commande, {
      through: models.CommandeArticle,
      foreignKey: 'article_id',
      as: 'commandes',
    });
    Article.belongsToMany(models.Remise, {
      through: models.RemiseArticle,
      foreignKey: 'article_id',
      as: 'remises',
    });
    Article.hasMany(models.AjustementStock, {
      foreignKey: 'article_id',
      as: 'ajustements',
      onDelete: 'CASCADE'
    });
  };

  return Article;
};