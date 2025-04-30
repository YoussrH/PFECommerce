module.exports = (sequelize, DataTypes) => {
  const ArticleCouleur = sequelize.define('ArticleCouleur', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    couleur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'article_couleur',
  });

  ArticleCouleur.associate = (models) => {
    ArticleCouleur.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
    });
    ArticleCouleur.belongsTo(models.Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur',
    });
  };

  return ArticleCouleur;
};