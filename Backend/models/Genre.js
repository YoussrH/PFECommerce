module.exports = (sequelize, DataTypes) => {
  const Genre = sequelize.define('Genre', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'genre',
  });

  Genre.associate = (models) => {
    Genre.hasMany(models.Article, {
      foreignKey: 'genre_id',
      as: 'articles',
    });
    Genre.hasMany(models.Taille, {
      foreignKey: 'genre_id',
      as: 'tailles',
    });
    Genre.belongsToMany(models.Remise, {
      through: models.RemiseGenre,
      foreignKey: 'genre_id',
      as: 'remises',
    });
    
  };

  return Genre;
};