const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAchievement = sequelize.define('UserAchievement', {
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
  achievement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'achievements',
      key: 'id'
    }
  },
  world_id: {
    type: DataTypes.UUID,
    references: {
      model: 'worlds',
      key: 'id'
    }
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_achievements',
  underscored: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'achievement_id']
    }
  ]
});

module.exports = UserAchievement;