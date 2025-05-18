module.exports = (sequelize, DataTypes) => {
  const Couleur = sequelize.define('Couleur', {
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    hexcode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isHexColor: true
      }
    },
    source: {
      type: DataTypes.ENUM('predefine', 'utilisateur', 'ai'),
      defaultValue: 'utilisateur',
    },
    popularite: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'couleur',
  });

  Couleur.associate = (models) => {
    Couleur.belongsToMany(models.Article, {
      through: models.ArticleCouleur,
      foreignKey: 'couleur_id',
      as: 'articles',
    });
    Couleur.belongsToMany(Remise, {
      through: RemiseCouleur,
      foreignKey: 'couleur_id',
      as: 'color_discounts',
      onDelete: 'CASCADE'
    });
  };

  // Add hooks for hexcode validation
  Couleur.beforeValidate((couleur, options) => {
    if (couleur.hexcode && !couleur.hexcode.startsWith('#')) {
      couleur.hexcode = `#${couleur.hexcode}`;
    }
  });

  return Couleur;
};