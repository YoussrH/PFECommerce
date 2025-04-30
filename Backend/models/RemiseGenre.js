module.exports = (sequelize, DataTypes) => {
  const RemiseGenre = sequelize.define('RemiseGenre', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'remise_genre',
  });

  RemiseGenre.associate = (models) => {
    RemiseGenre.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
    });
    RemiseGenre.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
    });
  };

  return RemiseGenre;
};