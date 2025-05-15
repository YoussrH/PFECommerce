module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('fixed', 'percentage'),
      defaultValue: 'fixed'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    client_id: {
      type: DataTypes.UUID,
      references: {
        model: 'client',
        key: 'utilisateur_id'
      }
    }
  }, {
    tableName: 'coupon',
    timestamps: true,
    underscored: true
  });

  Coupon.associate = (models) => {
    Coupon.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client'
    });
  };

  return Coupon;
};