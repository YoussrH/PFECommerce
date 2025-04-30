const { DataTypes } = require('sequelize');
const { generateOrderReference } = require('../services/orderReferenceService');

module.exports = (sequelize) => {
  const Commande = sequelize.define('Commande', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reference: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    adresse_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    livreur_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    prix_total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM(
        'en_attente',
        'confirmee',
        'en_preparation',
        'expediee',
        'livree',
        'annulee'
      ),
      defaultValue: 'en_attente',
    },
    methode_livraison: DataTypes.STRING,
    methode_paiement: DataTypes.STRING,
    frais_livraison: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    notes_admin: DataTypes.TEXT,
    date_expedition: DataTypes.DATE,
    date_livraison: DataTypes.DATE,
    qr_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },
    qr_expires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'commande',
    hooks: {
      beforeValidate: async (commande) => {
        if (!commande.reference) {
          commande.reference = await generateOrderReference(sequelize);
        }
      },
      afterUpdate: async (commande) => {
        if (commande.changed('statut') && commande.statut === 'expediee') {
          commande.qr_token = DataTypes.UUIDV4();
          commande.qr_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await commande.save({ silent: true });
        }
      }
    },
  });

  // Add associations directly in the model
  Commande.associate = function(models) {
    Commande.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
    Commande.hasMany(models.CommandeArticle, {
      foreignKey: 'commande_id',
      as: 'commande_articles',
      onDelete: 'CASCADE'
    });
    
    Commande.belongsTo(models.Adresse, {
      foreignKey: 'adresse_id',
      as: 'adresse',
      onDelete: 'RESTRICT'
    });
    
    Commande.belongsTo(models.Livreur, {
      foreignKey: 'livreur_id',
      as: 'livreur',
      onDelete: 'SET NULL'
    });
    
    Commande.hasMany(models.CommandeArticle, {
      foreignKey: 'commande_id',
      as: 'commande_articles',
      onDelete: 'CASCADE'
    });
    
    Commande.hasMany(models.CommandeHistorique, {
      foreignKey: 'commande_id',
      as: 'historique',
      onDelete: 'CASCADE'
    });
    
    Commande.hasOne(models.Facture, {
      foreignKey: 'commande_id',
      as: 'facture',
      onDelete: 'CASCADE'
    });
  };

  return Commande;
};