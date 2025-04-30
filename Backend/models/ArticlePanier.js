module.exports = (sequelize, DataTypes) => {
  const ArticlePanier = sequelize.define(
    "ArticlePanier",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      article_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      panier_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantite: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      prix_au_moment_ajout: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      taille_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      couleur_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "article_panier",
      indexes: [
        {
          unique: true,
          name: "article_panier_unique_combination",
          fields: ["article_id", "panier_id", "taille_id", "couleur_id"],
        },
      ],
    }
  );

  ArticlePanier.associate = (models) => {
    ArticlePanier.belongsTo(models.Article, {
      foreignKey: "article_id",
      as: "article",
    });
    
    ArticlePanier.belongsTo(models.Panier, {
      foreignKey: "panier_id",
      as: "panier",
    });
    
    ArticlePanier.belongsTo(models.Taille, {
      foreignKey: "taille_id",
      as: "taille",
    });
    
    ArticlePanier.belongsTo(models.Couleur, {
      foreignKey: "couleur_id",
      as: "couleur",
    });
  };

  return ArticlePanier;
};