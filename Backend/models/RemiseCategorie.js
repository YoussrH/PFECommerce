module.exports = (sequelize, DataTypes) => {
  const RemiseCategorie = sequelize.define('RemiseCategorie', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'remise_categorie',
  });

  RemiseCategorie.associate = (models) => {
    RemiseCategorie.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
    });
    RemiseCategorie.belongsTo(models.Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie',
    });
  };

  return RemiseCategorie;
};