module.exports = (sequelize, DataTypes) => {
  const Panier = sequelize.define('Panier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    guest_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'panier',
  });

  Panier.associate = (models) => {
    Panier.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    Panier.belongsToMany(models.Article, {
      through: models.ArticlePanier,
      foreignKey: 'panier_id',
      as: 'articles',
    });
  };

  return Panier;
};