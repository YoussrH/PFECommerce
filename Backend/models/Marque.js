module.exports = (sequelize, DataTypes) => {
  const Marque = sequelize.define('Marque', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'marque',
  });

  Marque.associate = (models) => {
    Marque.hasMany(models.Article, {
      foreignKey: 'marque_id',
      as: 'articles',
    });
  };

  return Marque;
};