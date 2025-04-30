// models/Utilisateur.js
module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prefix: {
      type: DataTypes.ENUM('Madame', 'Monsieur', 'Mlle', ''),
      defaultValue: '',
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    mot_de_passe: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: DataTypes.STRING,
    otp_expires: DataTypes.DATE,
    code_reinitialisation: DataTypes.STRING,
    token_reinitialisation: DataTypes.STRING,
    expiration_token_reinitialisation: DataTypes.DATE,
    est_verifie: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    newsletter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'super_admin'),
      defaultValue: 'user',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    }
    
  }, {
    tableName: 'utilisateur',
  });

  Utilisateur.associate = (models) => {
    Utilisateur.hasOne(models.Client, {
      foreignKey: 'utilisateur_id',
      as: 'client',
    });
    Utilisateur.hasOne(models.Panier, {
      foreignKey: 'utilisateur_id',
      as: 'panier',
    });
    Utilisateur.belongsToMany(models.Remise, {
      through: models.RemiseUtilisateur,
      foreignKey: 'utilisateur_id',
      as: 'remises',
    });
    Utilisateur.belongsTo(models.Utilisateur, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    Utilisateur.hasMany(models.AjustementStock, {
      foreignKey: 'admin_id',
      as: 'ajustements'
    });
  };

  return Utilisateur;
};