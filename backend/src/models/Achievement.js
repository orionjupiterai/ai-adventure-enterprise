const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  icon_url: {
    type: DataTypes.STRING(500)
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  category: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'achievements',
  underscored: true,
  timestamps: false,
  createdAt: 'created_at'
});

module.exports = Achievement;