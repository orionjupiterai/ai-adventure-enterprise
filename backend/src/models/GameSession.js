const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  world_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'worlds',
      key: 'id'
    }
  },
  session_name: {
    type: DataTypes.STRING(255)
  },
  current_location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  game_state: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  inventory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_multiplayer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_played_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'game_sessions',
  underscored: true,
  timestamps: false,
  hooks: {
    beforeUpdate: (session) => {
      session.last_played_at = new Date();
    }
  }
});

module.exports = GameSession;