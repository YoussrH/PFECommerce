// models/CommandeArticle.js
module.exports = (sequelize, DataTypes) => {
  const CommandeArticle = sequelize.define('CommandeArticle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    prix_unitaire: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    couleur_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taille_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'commande_article',
    indexes: [
      {
        unique: true,
        name: 'unique_commande_article_combination',
        fields: ['commande_id', 'article_id', 'couleur_id', 'taille_id'],
      }
    ],
  });

  // Remove the conflicting constraint from your database:
  // ALTER TABLE commande_article DROP CONSTRAINT commande_article_commande_id_article_id_key;

  CommandeArticle.associate = (models) => {
    CommandeArticle.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
    });
    CommandeArticle.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
    });
    CommandeArticle.belongsTo(models.Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur',
    });
    CommandeArticle.belongsTo(models.Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
    });
  };

  return CommandeArticle;
};