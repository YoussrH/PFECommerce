module.exports = (sequelize, DataTypes) => {
  const Couleur = sequelize.define('Couleur', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    hexcode: DataTypes.STRING,
  }, {
    tableName: 'couleur',
  });

  Couleur.associate = (models) => {
    Couleur.belongsToMany(models.Article, {
      through: models.ArticleCouleur,
      foreignKey: 'couleur_id',
      as: 'articles',
    });
  };

  return Couleur;
};