const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SaveGame = sequelize.define('SaveGame', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'game_sessions',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  save_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  save_data: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'save_games',
  underscored: true,
  timestamps: false,
  createdAt: 'created_at'
});

module.exports = SaveGame;