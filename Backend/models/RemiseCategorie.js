module.exports = (sequelize, DataTypes) => {
  const RemiseCategorie = sequelize.define('RemiseCategorie', {
    remise_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'remise_categorie',
    indexes: [
      {
        unique: true,
        fields: ['remise_id', 'categorie_id']
      }
    ]
  });

  RemiseCategorie.associate = (models) => {
    RemiseCategorie.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise'
    });
    RemiseCategorie.belongsTo(models.Categorie, {
      foreignKey: 'categorie_id',
      as: 'categorie'
    });
  };

  return RemiseCategorie;
};