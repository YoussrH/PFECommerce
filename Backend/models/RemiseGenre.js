module.exports = (sequelize, DataTypes) => {
  const RemiseGenre = sequelize.define('RemiseGenre', {
    remise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'remise',
        key: 'id'
      }
    },
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'genre',
        key: 'id'
      }
    }
  }, {
    tableName: 'remise_genre',
    indexes: [
      {
        unique: true,
        fields: ['remise_id', 'genre_id'],
        name: 'unique_remise_genre'
      },
      {
        fields: ['genre_id'],
        name: 'idx_remise_genre_genre'
      }
    ]
  });

  RemiseGenre.associate = (models) => {
    RemiseGenre.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
      onDelete: 'CASCADE'
    });
    RemiseGenre.belongsTo(models.Genre, {
      foreignKey: 'genre_id',
      as: 'genre',
      onDelete: 'CASCADE'
    });
  };

  return RemiseGenre;
};