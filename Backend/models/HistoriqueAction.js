// models/HistoriqueAction.js
module.exports = (sequelize, DataTypes) => {
    const HistoriqueAction = sequelize.define('HistoriqueAction', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING,
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'utilisateur',
          key: 'id'
        }
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: true,  // Allow null for deleted users
        references: {
          model: 'utilisateur',
          key: 'id',
          onDelete: 'SET NULL'  // Set to null when referenced user is deleted
        }
        },
    }, {
      tableName: 'historique_action',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    });
  
    return HistoriqueAction;
  };