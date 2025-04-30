module.exports = (sequelize, DataTypes) => {
  const AjustementStock = sequelize.define('AjustementStock', {
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
      allowNull: true,
      references: {
        model: 'taille',
        key: 'id'
      }
    },
    quantite_avant: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantite_apres: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    difference: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    raison: {
      type: DataTypes.ENUM(
        "Réception fournisseur",
        "Retour client",
        "Inventaire physique",
        "Correction de stock",
        "Défectuosité",
        "Transfert",
        "Autre"
      ),
      allowNull: false
    },
    raison_autre: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    type: {
      type: DataTypes.ENUM('adjustment', 'correction', 'transfer', 'bulk'),
      allowNull: false,
      defaultValue: 'adjustment'
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    }
  }, {
    tableName: 'ajustement_stock',
    timestamps: true,
    underscored: true
  });

  AjustementStock.associate = (models) => {
    AjustementStock.belongsTo(models.Article, {
      foreignKey: 'article_id',
      as: 'article',
      onDelete: 'CASCADE'
    });
    
    AjustementStock.belongsTo(models.Taille, {
      foreignKey: 'taille_id',
      as: 'taille',
      onDelete: 'CASCADE'
    });
    
    AjustementStock.belongsTo(models.Utilisateur, {
      foreignKey: 'admin_id',
      as: 'admin',
      onDelete: 'CASCADE'
    });
  };
  
  return AjustementStock;
};