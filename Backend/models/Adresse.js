// models/Adresse.js
module.exports = (sequelize, DataTypes) => {
    const Adresse = sequelize.define('Adresse', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      nom_adresse: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Adresse Principale'
      },
      adresse: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      complement: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      code_postal: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ville: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gouvernorat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telephone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      est_principale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'adresse',
    });
  
    Adresse.associate = (models) => {
      Adresse.belongsTo(models.Client, {
        foreignKey: 'client_id',
        as: 'client'
      });
      Adresse.hasMany(models.Commande, {
        foreignKey: 'adresse_id',
        as: 'commandes'
      });
    };
  
    return Adresse;
  };