module.exports = (sequelize, DataTypes) => {
  const Taille = sequelize.define('Taille', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'taille',
  });

  Taille.associate = (models) => {
    Taille.belongsTo(models.Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
    });
    Taille.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
    });
    Taille.belongsToMany(models.Article, {
      through: models.ArticleTaille,
      foreignKey: 'taille_id',
      as: 'articles',
    });
  };

  return Taille;
};