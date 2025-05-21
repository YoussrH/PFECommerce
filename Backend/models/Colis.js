// models/Colis.js
const { DataTypes } = require('sequelize');
const QRCode = require('qrcode');

module.exports = (sequelize) => {
  const Colis = sequelize.define('Colis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commande_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    livreur_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    numero_suivi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    statut: {
      type: DataTypes.ENUM(
        'en_preparation',
        'expediee',
        'livree',
        'retourne',
        'remplacee',
        'annulee'
      ),
      defaultValue: 'en_preparation'
    },
    date_expedition: DataTypes.DATE,
    date_livraison: DataTypes.DATE,
    date_retour: DataTypes.DATE,
    qr_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    qr_expires: DataTypes.DATE,
    qr_code_data: DataTypes.TEXT,
    transporteur: DataTypes.STRING,
    url_suivi: DataTypes.STRING,
    notes: DataTypes.TEXT,
    motif_annulation: DataTypes.TEXT
  }, {
    tableName: 'colis',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeValidate: async (colis) => {
        if (!colis.numero_suivi) {
          colis.numero_suivi = `TRK${Date.now().toString(36).toUpperCase()}`;
        }
      },
      afterUpdate: async (colis) => {
        if (colis.changed('statut')) {
          if (colis.statut === 'expediee' && !colis.date_expedition) {
            colis.date_expedition = new Date();
          }
          if (colis.statut === 'livree' && !colis.date_livraison) {
            colis.date_livraison = new Date();
          }
          if (colis.statut === 'retourne' && !colis.date_retour) {
            colis.date_retour = new Date();
          }
        }
      }
    }
  });

  Colis.prototype.generateQRCode = async function() {
    const qrData = JSON.stringify({
      colisId: this.id,
      token: this.qr_token,
      commandeId: this.commande_id
    });
    this.qr_code_data = await QRCode.toDataURL(qrData);
    this.qr_expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    return this.save();
  };

  Colis.associate = function(models) {
    Colis.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });
    Colis.belongsTo(models.Livreur, {
      foreignKey: 'livreur_id',
      as: 'livreur'
    });
  };

  return Colis;
};