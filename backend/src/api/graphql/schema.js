const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String
    avatarUrl: String
    isActive: Boolean!
    isAdmin: Boolean!
    createdAt: DateTime!
    worlds: [World!]
    gameSessions: [GameSession!]
    achievements: [UserAchievement!]
    prestigeSystem: PrestigeSystem
  }

  type World {
    id: ID!
    name: String!
    description: String
    author: User!
    worldData: JSON!
    thumbnailUrl: String
    tags: [String!]
    isPublic: Boolean!
    isFeatured: Boolean!
    playCount: Int!
    ratingAverage: Float!
    ratingCount: Int!
    version: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    ratings: [WorldRating!]
  }

  type GameSession {
    id: ID!
    user: User!
    world: World!
    sessionName: String
    currentLocation: String!
    gameState: JSON!
    inventory: JSON!
    stats: JSON!
    isActive: Boolean!
    isMultiplayer: Boolean!
    startedAt: DateTime!
    lastPlayedAt: DateTime!
    completedAt: DateTime
    saves: [SaveGame!]
  }

  type SaveGame {
    id: ID!
    session: GameSession!
    user: User!
    saveName: String!
    saveData: JSON!
    createdAt: DateTime!
  }

  type WorldRating {
    id: ID!
    world: World!
    user: User!
    rating: Int!
    review: String
    createdAt: DateTime!
  }

  type Achievement {
    id: ID!
    name: String!
    description: String
    iconUrl: String
    points: Int!
    category: String
  }

  type UserAchievement {
    id: ID!
    user: User!
    achievement: Achievement!
    world: World
    earnedAt: DateTime!
  }

  type MultiplayerRoom {
    id: ID!
    world: World!
    host: User!
    roomCode: String!
    roomName: String
    maxPlayers: Int!
    currentPlayers: Int!
    gameState: JSON!
    isActive: Boolean!
    isPrivate: Boolean!
    createdAt: DateTime!
    participants: [RoomParticipant!]
  }

  type RoomParticipant {
    id: ID!
    room: MultiplayerRoom!
    user: User!
    playerState: JSON!
    joinedAt: DateTime!
    leftAt: DateTime
  }

  type AIContent {
    id: ID!
    world: World!
    session: GameSession
    contentType: String!
    prompt: String!
    generatedContent: String
    metadata: JSON!
    tokensUsed: Int!
    createdAt: DateTime!
  }

  # Prestige System Types
  type PrestigeSystem {
    id: ID!
    user: User!
    prestigeLevel: Int!
    totalPrestigePoints: Int!
    currentSeasonPoints: Int!
    seasonId: String!
    tier: PrestigeTier!
    unlockedStoryArcs: [String!]!
    unlockedCosmetics: [String!]!
    unlockedTitles: [String!]!
    mentorStatus: Boolean!
    lifetimeHoursPlayed: Int!
    skillMasteries: JSON!
    lastPrestigeDate: DateTime
    seasonStartDate: DateTime!
    isActive: Boolean!
    tierBenefits: TierBenefits!
    seasonProgress: SeasonProgress!
    canPrestige: Boolean!
  }

  enum PrestigeTier {
    INITIATE
    ASCENDANT
    LUMINARY
    TRANSCENDENT
    ETERNAL
  }

  type TierBenefits {
    storyArcsUnlocked: Int!
    cosmeticsUnlocked: Int!
    titlesUnlocked: Int!
    mentorSlots: Int!
    specialFeatures: [String!]!
  }

  type SeasonProgress {
    expired: Boolean!
    daysRemaining: Int!
    progress: Float!
  }

  type SeasonalTrack {
    id: ID!
    user: User!
    seasonId: String!
    trackType: SeasonalTrackType!
    currentTier: Int!
    currentProgress: Int!
    tierThreshold: Int!
    totalPointsEarned: Int!
    completedChallenges: [String!]!
    unlockedRewards: [JSON!]!
    premiumTrack: Boolean!
    lastActivity: DateTime!
    seasonStartDate: DateTime!
    seasonEndDate: DateTime!
    isCompleted: Boolean!
    timeRemaining: TimeRemaining!
  }

  enum SeasonalTrackType {
    EXPLORATION
    MASTERY
    SOCIAL
    CREATIVE
    NARRATIVE
  }

  type TimeRemaining {
    expired: Boolean!
    days: Int!
    hours: Int!
  }

  type PrestigeReward {
    id: ID!
    name: String!
    description: String!
    rewardType: RewardType!
    rarity: RewardRarity!
    unlockRequirements: JSON!
    rewardData: JSON!
    category: String
    isSeasonal: Boolean!
    seasonId: String
    isExclusive: Boolean!
    maxQuantity: Int!
    intrinsicValue: Int!
    socialRecognition: Boolean!
    iconUrl: String
    previewUrl: String
    isActive: Boolean!
  }

  enum RewardType {
    COSMETIC
    STORY_ARC
    TITLE
    EMOTE
    ABILITY
    CUSTOMIZATION
    SOCIAL
    LEGACY
  }

  enum RewardRarity {
    COMMON
    RARE
    EPIC
    LEGENDARY
    MYTHIC
  }

  type PrestigeLeaderboards {
    currentSeason: [LeaderboardEntry!]!
    allTime: [LeaderboardEntry!]!
  }

  type LeaderboardEntry {
    userId: ID!
    username: String!
    displayName: String
    points: Int!
    tier: PrestigeTier!
    prestigeLevel: Int!
  }

  type PrestigePointsResult {
    success: Boolean!
    pointsAwarded: Int
    totalPoints: Int!
    tier: PrestigeTier!
    tierAdvanced: Boolean!
    reason: String
    limit: Int
  }

  type PrestigeAdvancementResult {
    success: Boolean!
    newPrestigeLevel: Int
    rewards: [PrestigeReward!]
    reason: String
    cooldownDays: Int
  }

  type ComplianceReport {
    userId: ID!
    currentSession: SessionInfo
    dailyActivity: DailyActivity
    recentPerformance: RecentPerformance!
    recommendations: [Recommendation!]!
  }

  type SessionInfo {
    duration: Int!
    pointsEarned: Int!
    warnings: [JSON!]!
  }

  type DailyActivity {
    date: String!
    prestigePointsToday: Int!
    intrinsicRewardsToday: Int!
    extrinsicRewardsToday: Int!
    sessionsToday: Int!
    totalPlayTimeToday: Int!
    consecutiveDays: Int!
  }

  type RecentPerformance {
    healthySessionPercentage: Float!
    averageSessionTime: Int!
    totalSessions: Int!
  }

  type Recommendation {
    type: String!
    priority: String!
    message: String!
  }

  type SystemComplianceMetrics {
    healthyPlaySessions: Int!
    excessivePlaySessions: Int!
    intrinsicRewardRatio: Float!
    playerWellnessInterventions: Int!
    forcedBreaksSuggested: Int!
    activeSessions: Int!
    dailyActiveUsers: Int!
    averageSessionHealth: Float!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type PaginatedWorlds {
    worlds: [World!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type PaginatedSessions {
    sessions: [GameSession!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type GameActionResult {
    success: Boolean!
    currentLocation: String!
    locationData: JSON
    message: String
    inventoryUpdate: JSON
    stateUpdate: JSON
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(page: Int, limit: Int): [User!]!

    # World queries
    world(id: ID!): World
    worlds(
      page: Int
      limit: Int
      search: String
      tags: [String!]
      sortBy: String
      order: String
      featured: Boolean
    ): PaginatedWorlds!
    myWorlds(page: Int, limit: Int): PaginatedWorlds!

    # Game session queries
    gameSession(id: ID!): GameSession
    mySessions(page: Int, limit: Int, active: Boolean): PaginatedSessions!
    
    # Save game queries
    mySaves: [SaveGame!]!
    
    # Multiplayer queries
    multiplayerRoom(id: ID!): MultiplayerRoom
    activeRooms(page: Int, limit: Int, showPrivate: Boolean): [MultiplayerRoom!]!
    
    # Achievement queries
    achievements: [Achievement!]!
    myAchievements: [UserAchievement!]!
    
    # Prestige system queries
    prestigeStatus: PrestigeSystem
    seasonalTracks: [SeasonalTrack!]!
    prestigeLeaderboards(limit: Int): PrestigeLeaderboards!
    prestigeRewards(tier: PrestigeTier): [PrestigeReward!]!
    complianceReport: ComplianceReport!
    systemComplianceMetrics: SystemComplianceMetrics!
    
    # AI content queries
    aiUsageStats: JSON!
  }

  type Mutation {
    # Auth mutations
    register(username: String!, email: String!, password: String!, displayName: String): AuthPayload!
    login(username: String, email: String, password: String!): AuthPayload!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    
    # User mutations
    updateProfile(displayName: String, avatarUrl: String, email: String): User!
    deleteAccount(password: String!, confirmation: String!): Boolean!
    
    # World mutations
    createWorld(
      name: String!
      description: String
      worldData: JSON!
      tags: [String!]
      isPublic: Boolean
    ): World!
    updateWorld(
      id: ID!
      name: String
      description: String
      worldData: JSON
      tags: [String!]
      isPublic: Boolean
    ): World!
    deleteWorld(id: ID!): Boolean!
    rateWorld(worldId: ID!, rating: Int!, review: String): WorldRating!
    
    # Game session mutations
    startGame(worldId: ID!, sessionName: String): GameSession!
    performAction(sessionId: ID!, action: String!, target: String!): GameActionResult!
    saveGame(sessionId: ID!, saveName: String!): SaveGame!
    loadGame(saveId: ID!): GameSession!
    
    # Multiplayer mutations
    createRoom(
      worldId: ID!
      roomName: String
      maxPlayers: Int
      isPrivate: Boolean
    ): MultiplayerRoom!
    joinRoom(roomCode: String!): MultiplayerRoom!
    leaveRoom(roomId: ID!): Boolean!
    updatePlayerState(roomId: ID!, playerState: JSON!): Boolean!
    
    # Prestige system mutations
    initializePrestige(playerLevel: Int!): PrestigeSystem!
    awardPrestigePoints(activity: String!, points: Int!, context: JSON): PrestigePointsResult!
    advancePrestige: PrestigeAdvancementResult!
    startSession(sessionData: JSON): Boolean!
    updateSessionActivity(activity: String!): Boolean!
    endSession: Boolean!
    
    # AI mutations
    generateStory(sessionId: ID!, prompt: String!, context: JSON): String!
    generateImage(sessionId: ID!, description: String!, style: String): String!
    aiDungeonMaster(sessionId: ID!, action: String!, gameContext: JSON): JSON!
  }

  type Subscription {
    # Multiplayer subscriptions
    roomUpdates(roomId: ID!): MultiplayerRoom!
    playerAction(roomId: ID!): JSON!
    chatMessage(roomId: ID!): JSON!
    
    # Notification subscriptions
    notification: JSON!
  }
`;

module.exports = typeDefs;