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
      references: {
        model: 'commandes',
        key: 'id'
      }
    },
    livreur_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'livreurs',
        key: 'id'
      }
    },
    numero_suivi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    statut: {
      type: DataTypes.ENUM(
        'preparation',
        'expedie',
        'livre'
      ),
      defaultValue: 'preparation'
    },
    date_expedition: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_livraison: {
      type: DataTypes.DATE,
      allowNull: true
    },
    qr_token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true
    },
    qr_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    qr_code_data: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'colis',
    timestamps: true,
    paranoid: true
  });

  // Instance method to generate QR code
  Colis.prototype.generateQRCode = async function() {
    try {
      const qrData = JSON.stringify({
        colisId: this.id,
        token: this.qr_token
      });
      this.qr_code_data = await QRCode.toDataURL(qrData);
      this.qr_expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      return this.qr_code_data;
    } catch (err) {
      console.error('QR Code generation error:', err);
      throw err;
    }
  };

  // Generate tracking number hook
  Colis.beforeCreate(async (colis) => {
    if (!colis.numero_suivi) {
      const prefix = 'TRK';
      const random = Math.floor(1000000000 + Math.random() * 9000000000);
      colis.numero_suivi = `${prefix}${random}`;
    }
  });

  return Colis;
};