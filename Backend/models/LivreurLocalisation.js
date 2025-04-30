// models/LivreurLocalisation.js
module.exports = (sequelize, DataTypes) => {
    const LivreurLocalisation = sequelize.define('LivreurLocalisation', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      livreur_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      precision: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      vitesse: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      batterie_niveau: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      en_course: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      commande_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    }, {
      tableName: 'livreur_localisation',
      indexes: [
        {
          fields: ['livreur_id']
        },
        {
          fields: ['created_at']
        }
      ]
    });
  
    LivreurLocalisation.associate = (models) => {
      LivreurLocalisation.belongsTo(models.Livreur, {
        foreignKey: 'livreur_id',
        as: 'livreur',
      });
      LivreurLocalisation.belongsTo(models.Commande, {
        foreignKey: 'commande_id',
        as: 'commande',
      });
    };
  
    return LivreurLocalisation;
  };