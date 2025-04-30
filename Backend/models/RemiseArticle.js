module.exports = (sequelize, DataTypes) => {
  const RemiseArticle = sequelize.define('RemiseArticle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    remise_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pourcentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
  }, {
    tableName: 'remise_article',
  });

  RemiseArticle.associate = (models) => {
    RemiseArticle.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
    });
    RemiseArticle.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
    });
  };

  return RemiseArticle;
};