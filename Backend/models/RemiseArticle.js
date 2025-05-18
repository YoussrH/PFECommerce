module.exports = (sequelize, DataTypes) => {
  const RemiseArticle = sequelize.define('RemiseArticle', {
    remise_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'remise_article',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['remise_id', 'article_id']
      }
    ]
  });

  RemiseArticle.associate = (models) => {
    RemiseArticle.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise'
    });
    RemiseArticle.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article'
    });
  };

  return RemiseArticle;
};