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
    Genre.belongsToMany(Remise, {
    through: RemiseGenre,
    foreignKey: 'genre_id',
    as: 'gender_discounts',
    onDelete: 'CASCADE'
  });
    
  };

  return Genre;
};