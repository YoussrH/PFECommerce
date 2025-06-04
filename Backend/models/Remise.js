module.exports = (sequelize, DataTypes) => {
  const Remise = sequelize.define('Remise', {
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    libelle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    type_remise: {
      type: DataTypes.ENUM('pourcentage', 'montant_fixe', 'bogo', 'seuil'),
      allowNull: false
    },
    valeur: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },
    est_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    min_articles: DataTypes.INTEGER,
    min_montant: DataTypes.FLOAT,
    max_utilisation: DataTypes.INTEGER,
    utilisations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    est_cumulable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    apply_to: {
      type: DataTypes.ENUM('all', 'categories', 'articles', 'marques', 'genres'),
      defaultValue: 'all'
    },
        evenement_id: { // Add this foreign key field
      type: DataTypes.INTEGER,
      allowNull: true, // Allow discounts without a specific event
      references: {
        model: 'evenements', // plural table name
        key: 'id'
      }
    }
  }, {
    tableName: 'remise',

  });

  Remise.associate = (models) => {
    Remise.belongsToMany(models.Article, {
      through: models.RemiseArticle,
      foreignKey: 'remise_id',
      as: 'discounted_articles'
    });
    
    Remise.belongsToMany(models.Categorie, {
      through: models.RemiseCategorie,
      foreignKey: 'remise_id',
      as: 'discounted_categories'
    });
    
    Remise.belongsToMany(models.Marque, {
      through: models.RemiseMarque,
      foreignKey: 'remise_id',
      as: 'discounted_marques'
    });
    
    Remise.belongsToMany(models.Genre, {
      through: models.RemiseGenre,
      foreignKey: 'remise_id',
      as: 'discounted_genres'
    });
        Remise.belongsTo(models.Evenement, { // New association
      foreignKey: 'evenement_id',
      as: 'evenement',
      onDelete: 'SET NULL' // If an event is deleted, set evenement_id to NULL on remises
    });

  };

  return Remise;
};