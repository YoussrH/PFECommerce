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
      },
      numero: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      date_emission: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      montant_ht: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      taux_tva: {
        type: DataTypes.FLOAT,
        defaultValue: 20.0,
      },
      montant_ttc: {
        type: DataTypes.FLOAT,
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
      date_paiement: DataTypes.DATE,
    }, {
      tableName: 'facture',
    });
  
    Facture.associate = (models) => {
      Facture.belongsTo(models.Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
      });
    };
  
    return Facture;
  };