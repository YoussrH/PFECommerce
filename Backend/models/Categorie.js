module.exports = (sequelize, DataTypes) => {
  const Categorie = sequelize.define('Categorie', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'categorie',
  });

  Categorie.associate = (models) => {
    Categorie.hasMany(models.Categorie, {
      as: 'sous_categories',
      foreignKey: 'parent_id',
    });
    Categorie.belongsTo(models.Categorie, {
      as: 'parent',
      foreignKey: 'parent_id',
    });
    Categorie.hasMany(models.Article, {
      foreignKey: 'categorie_id',
      as: 'articles',
    });
    Categorie.hasMany(models.Taille, {
      foreignKey: 'categorie_id',
      as: 'tailles',
    });
  };

  return Categorie;
};