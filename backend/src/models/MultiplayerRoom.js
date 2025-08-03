const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MultiplayerRoom = sequelize.define('MultiplayerRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  world_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'worlds',
      key: 'id'
    }
  },
  host_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  room_code: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false
  },
  room_name: {
    type: DataTypes.STRING(255)
  },
  max_players: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    validate: {
      min: 2,
      max: 10
    }
  },
  current_players: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  game_state: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'multiplayer_rooms',
  underscored: true,
  timestamps: true
});

MultiplayerRoom.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = MultiplayerRoom;