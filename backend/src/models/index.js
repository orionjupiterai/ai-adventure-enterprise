const User = require('./User');
const World = require('./World');
const GameSession = require('./GameSession');
const SaveGame = require('./SaveGame');
const MultiplayerRoom = require('./MultiplayerRoom');
const RoomParticipant = require('./RoomParticipant');
const WorldRating = require('./WorldRating');
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');
const AIContent = require('./AIContent');
const PrestigeSystem = require('./PrestigeSystem');
const SeasonalTrack = require('./SeasonalTrack');
const PrestigeReward = require('./PrestigeReward');

// Define associations
// User associations
User.hasMany(World, { foreignKey: 'author_id', as: 'worlds' });
User.hasMany(GameSession, { foreignKey: 'user_id', as: 'gameSessions' });
User.hasMany(SaveGame, { foreignKey: 'user_id', as: 'saveGames' });
User.hasMany(WorldRating, { foreignKey: 'user_id', as: 'ratings' });
User.hasMany(UserAchievement, { foreignKey: 'user_id', as: 'achievements' });
User.hasMany(MultiplayerRoom, { foreignKey: 'host_id', as: 'hostedRooms' });

// World associations
World.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
World.hasMany(GameSession, { foreignKey: 'world_id', as: 'gameSessions' });
World.hasMany(WorldRating, { foreignKey: 'world_id', as: 'ratings' });
World.hasMany(MultiplayerRoom, { foreignKey: 'world_id', as: 'multiplayerRooms' });
World.hasMany(AIContent, { foreignKey: 'world_id', as: 'aiContent' });

// GameSession associations
GameSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
GameSession.belongsTo(World, { foreignKey: 'world_id', as: 'world' });
GameSession.hasMany(SaveGame, { foreignKey: 'session_id', as: 'saves' });
GameSession.hasMany(AIContent, { foreignKey: 'session_id', as: 'aiContent' });

// SaveGame associations
SaveGame.belongsTo(GameSession, { foreignKey: 'session_id', as: 'session' });
SaveGame.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// MultiplayerRoom associations
MultiplayerRoom.belongsTo(World, { foreignKey: 'world_id', as: 'world' });
MultiplayerRoom.belongsTo(User, { foreignKey: 'host_id', as: 'host' });
MultiplayerRoom.hasMany(RoomParticipant, { foreignKey: 'room_id', as: 'participants' });

// RoomParticipant associations
RoomParticipant.belongsTo(MultiplayerRoom, { foreignKey: 'room_id', as: 'room' });
RoomParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// WorldRating associations
WorldRating.belongsTo(World, { foreignKey: 'world_id', as: 'world' });
WorldRating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Achievement associations
Achievement.hasMany(UserAchievement, { foreignKey: 'achievement_id', as: 'userAchievements' });

// UserAchievement associations
UserAchievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'achievement' });
UserAchievement.belongsTo(World, { foreignKey: 'world_id', as: 'world' });

// AIContent associations
AIContent.belongsTo(World, { foreignKey: 'world_id', as: 'world' });
AIContent.belongsTo(GameSession, { foreignKey: 'session_id', as: 'session' });

// Prestige System associations
User.hasOne(PrestigeSystem, { foreignKey: 'user_id', as: 'prestigeSystem' });
User.hasMany(SeasonalTrack, { foreignKey: 'user_id', as: 'seasonalTracks' });

PrestigeSystem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

SeasonalTrack.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  World,
  GameSession,
  SaveGame,
  MultiplayerRoom,
  RoomParticipant,
  WorldRating,
  Achievement,
  UserAchievement,
  AIContent,
  PrestigeSystem,
  SeasonalTrack,
  PrestigeReward
};