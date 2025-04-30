module.exports = (sequelize, DataTypes) => {
  const ArticleTaille = sequelize.define('ArticleTaille', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'article',
        key: 'id'
      }
    },
    taille_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero: function(value) {
          if (value === 0) {
            throw new Error('L\'ID de la taille ne peut pas être 0');
          }
        }
      },
      references: {
        model: 'taille',
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
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [0],
          msg: 'La quantité doit être au moins 0'
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'article_taille',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['article_id', 'taille_id', 'couleur_id'],
        name: 'unique_article_taille_couleur'
      }
    ],
    hooks: {
      beforeCreate: async (articleTaille, options) => {
        if (articleTaille.taille_id === 0) {
          throw new Error('ID de taille invalide : ne peut pas être 0');
        }
        if (articleTaille.quantite < 1) {
          throw new Error('La quantité doit être au moins 1');
        }
        
        const existing = await ArticleTaille.findOne({
          where: {
            article_id: articleTaille.article_id,
            taille_id: articleTaille.taille_id,
            couleur_id: articleTaille.couleur_id
          },
          transaction: options.transaction
        });

        if (existing) {
          throw new Error('Cette combinaison article/taille/couleur existe déjà');
        }
      },
      beforeUpdate: (articleTaille, options) => {
        articleTaille.updated_at = sequelize.literal('CURRENT_TIMESTAMP');
      }
    }
  });

  ArticleTaille.associate = (models) => {
    ArticleTaille.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });
    ArticleTaille.belongsTo(models.Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
      onDelete: 'CASCADE'
    });
    ArticleTaille.belongsTo(models.Couleur, {
      foreignKey: 'couleur_id',
      as: 'couleur',
      onDelete: 'CASCADE'
    });
  };

  ArticleTaille.upsertCombination = async (values, options) => {
    return await ArticleTaille.findOne({
      where: {
        article_id: values.article_id,
        taille_id: values.taille_id,
        couleur_id: values.couleur_id
      },
      transaction: options?.transaction
    }).then(async (existing) => {
      if (existing) {
        return await existing.update(values, options);
      }
      return await ArticleTaille.create(values, options);
    });
  };

  return ArticleTaille;
};