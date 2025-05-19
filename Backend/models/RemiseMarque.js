module.exports = (sequelize, DataTypes) => {
  const RemiseMarque = sequelize.define('RemiseMarque', {
    remise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'remise',
        key: 'id'
      }
    },
    marque_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'marque',
        key: 'id'
      }
    }
  }, {
    tableName: 'remise_marque',
    indexes: [
      {
        unique: true,
        fields: ['remise_id', 'marque_id'],
        name: 'unique_remise_marque'
      },
      {
        fields: ['marque_id'],
        name: 'idx_remise_marque_marque'
      }
    ]
  });

  RemiseMarque.associate = (models) => {
    RemiseMarque.belongsTo(models.Remise, {
      foreignKey: 'remise_id',
      as: 'remise',
      onDelete: 'CASCADE'
    });
    RemiseMarque.belongsTo(models.Marque, {
      foreignKey: 'marque_id',
      as: 'marque',
      onDelete: 'CASCADE'
    });
  };

  return RemiseMarque;
};