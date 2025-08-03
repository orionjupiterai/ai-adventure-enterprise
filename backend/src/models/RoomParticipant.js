const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoomParticipant = sequelize.define('RoomParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  room_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'multiplayer_rooms',
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
  player_state: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  left_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'room_participants',
  underscored: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'user_id']
    }
  ]
});

module.exports = RoomParticipant;