const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const World = sequelize.define('World', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  author_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  world_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidWorldData(value) {
        if (!value.worldInfo || !value.locations || !value.startLocation) {
          throw new Error('Invalid world data structure');
        }
      }
    }
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    validate: {
      isUrl: true
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  play_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating_average: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0'
  }
}, {
  tableName: 'worlds',
  underscored: true,
  timestamps: true
});

module.exports = World;