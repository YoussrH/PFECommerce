// models/ImageArticleCouleur.js
module.exports = (sequelize, DataTypes) => {
    const ImageArticleCouleur = sequelize.define('ImageArticleCouleur', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      article_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'article',
          key: 'id'
        }
      },
      couleur_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'couleur',
          key: 'id'
        }
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ordre_affichage: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    }, {
      tableName: 'image_article_couleur',
      indexes: [
        {
          unique: false,
          fields: ['article_id', 'couleur_id']
        }
      ]
    });
  
    ImageArticleCouleur.associate = (models) => {
      ImageArticleCouleur.belongsTo(models.Article, {
        foreignKey: 'article_id',
        as: 'article'
      });
      ImageArticleCouleur.belongsTo(models.Couleur, {
        foreignKey: 'couleur_id',
        as: 'couleur'
      });
    };
  
    return ImageArticleCouleur;
  };