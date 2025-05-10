// models/Commande.js
const { DataTypes } = require('sequelize');
const { generateOrderReference } = require('../services/orderReferenceService');

module.exports = (sequelize, DataTypes) => {
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
        'en_preparation',
        'expediee',
        'livree',
        'annulee',
        'remplacee'
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
    remplace_commande_id: { // Reference to replaced order
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {
    tableName: 'commande',
    hooks: {
      beforeValidate: async (commande) => {
        if (!commande.reference) {
          commande.reference = await generateOrderReference(sequelize);
        }
      }
    }
  });

  Commande.associate = function(models) {
    Commande.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
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
    
    Commande.hasMany(models.Colis, {
      foreignKey: 'commande_id',
      as: 'colis',
      onDelete: 'CASCADE'
    });
    
    Commande.hasMany(models.Retour, {
      foreignKey: 'commande_id',
      as: 'retours',
      onDelete: 'CASCADE'
    });
    
    // Self-reference for replaced orders
    Commande.belongsTo(models.Commande, {
      foreignKey: 'remplace_commande_id',
      as: 'commande_remplacee'
    });
  };

  return Commande;
};