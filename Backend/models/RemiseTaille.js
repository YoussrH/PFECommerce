module.exports = (sequelize, DataTypes) => {
  const RemiseTaille = sequelize.define('RemiseTaille', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    taille_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'remise_taille',
  });

  RemiseTaille.associate = (models) => {
    RemiseTaille.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
    });
    RemiseTaille.belongsTo(models.Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
    });
  };

  return RemiseTaille;
};