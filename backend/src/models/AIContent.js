const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIContent = sequelize.define('AIContent', {
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
  session_id: {
    type: DataTypes.UUID,
    references: {
      model: 'game_sessions',
      key: 'id'
    }
  },
  content_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['story', 'image', 'voice', 'character', 'location']]
    }
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  generated_content: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'ai_content',
  underscored: true,
  timestamps: false,
  createdAt: 'created_at'
});

module.exports = AIContent;