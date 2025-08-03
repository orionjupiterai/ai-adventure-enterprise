const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorldRating = sequelize.define('WorldRating', {
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'world_ratings',
  underscored: true,
  timestamps: false,
  createdAt: 'created_at',
  indexes: [
    {
      unique: true,
      fields: ['world_id', 'user_id']
    }
  ]
});

module.exports = WorldRating;