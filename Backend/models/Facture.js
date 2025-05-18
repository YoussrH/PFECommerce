// models/Facture.js
module.exports = (sequelize, DataTypes) => {
  const Facture = sequelize.define('Facture', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'commande',
        key: 'id'
      }
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    date_emission: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    montant_ht: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taux_tva: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 19.00,
    },
    montant_ttc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fichier_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    est_payee: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    date_paiement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    methode_paiement: {
      type: DataTypes.STRING(50),
      allowNull: true,
    }
  }, {
    tableName: 'facture',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: async (facture) => {
        // Automatically set payment status based on commande
        if (facture.est_payee && !facture.date_paiement) {
          facture.date_paiement = new Date();
        }
      }
    }
  });

  Facture.associate = (models) => {
    Facture.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande',
      onDelete: 'CASCADE'
    });
  };

  return Facture;
};