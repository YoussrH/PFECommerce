// models/ListeEnvies.js
module.exports = (sequelize, DataTypes) => {
  const ListeEnvies = sequelize.define('ListeEnvies', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'article',
        key: 'id'
      }
    },
    date_ajout: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'liste_envies',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['utilisateur_id', 'article_id'],
        name: 'unique_user_article_wishlist'
      }
    ],
    hooks: {
      beforeCreate: async (listeEnvies, options) => {
        // Verify the user exists and is authenticated
        const user = await sequelize.models.Utilisateur.findByPk(listeEnvies.utilisateur_id, {
          transaction: options.transaction
        });
        
        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }
        
        // Verify the article exists
        const article = await sequelize.models.Article.findByPk(listeEnvies.article_id, {
          transaction: options.transaction
        });
        
        if (!article) {
          throw new Error('Article non trouvé');
        }
        
        // Check if already in wishlist
        const existing = await ListeEnvies.findOne({
          where: {
            utilisateur_id: listeEnvies.utilisateur_id,
            article_id: listeEnvies.article_id
          },
          transaction: options.transaction
        });
        
        if (existing) {
          throw new Error('Cet article est déjà dans votre liste d\'envies');
        }
      }
    }
  });

  ListeEnvies.associate = (models) => {
    ListeEnvies.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
      onDelete: 'CASCADE'
    });
    
    ListeEnvies.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });
  };

  return ListeEnvies;
};