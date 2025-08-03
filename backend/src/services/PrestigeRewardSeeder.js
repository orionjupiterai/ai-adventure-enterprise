/**
 * Prestige Reward Seeder
 * Creates the initial reward structure for the prestige system
 */

const { PrestigeReward } = require('../models');

class PrestigeRewardSeeder {
  constructor() {
    this.rewards = [];
  }

  /**
   * Seed all prestige rewards
   */
  async seedAllRewards() {
    await this.seedInitiateRewards();
    await this.seedAscendantRewards();
    await this.seedLuminaryRewards();
    await this.seedTranscendentRewards();
    await this.seedEternalRewards();
    await this.seedSeasonalRewards();
    
    console.log(`Seeded ${this.rewards.length} prestige rewards`);
    return this.rewards;
  }

  /**
   * Initiate Tier Rewards (Prestige 0-1)
   */
  async seedInitiateRewards() {
    // Story Arc
    const prologue = await PrestigeReward.createStoryArc({
      name: 'Prologue Extended: The First Steps',
      description: 'An expanded introduction to the mysteries of the realm, revealing the ancient powers that await those who dare to ascend.',
      rarity: 'common',
      requirements: { tier: 'initiate' },
      storyArcId: 'prologue_extended',
      chapterCount: 3,
      estimatedPlaytime: 120, // 2 hours
      category: 'initiate_collection',
      iconUrl: '/icons/story/prologue_extended.png'
    });

    // Basic Cosmetics
    const basicAura = await PrestigeReward.createCosmetic({
      name: 'Awakened Aura',
      description: 'A subtle shimmer that surrounds those who have begun their journey of ascension.',
      rarity: 'common',
      requirements: { tier: 'initiate' },
      cosmeticId: 'aura_awakened',
      slot: 'aura',
      visualEffects: ['subtle_shimmer', 'gentle_glow'],
      category: 'initiate_collection',
      iconUrl: '/icons/cosmetics/aura_awakened.png',
      previewUrl: '/previews/aura_awakened.gif'
    });

    const noviceCloak = await PrestigeReward.createCosmetic({
      name: 'Novice\'s Journey Cloak',
      description: 'A simple but elegant cloak that marks the beginning of a grand adventure.',
      rarity: 'common',
      requirements: { tier: 'initiate' },
      cosmeticId: 'cloak_novice_journey',
      slot: 'cloak',
      visualEffects: ['gentle_flowing'],
      customizationOptions: { colors: ['deep_blue', 'forest_green', 'midnight_purple'] },
      category: 'initiate_collection',
      iconUrl: '/icons/cosmetics/cloak_novice.png'
    });

    // Title
    const awakened = await PrestigeReward.createTitle({
      name: 'The Awakened',
      description: 'A title bestowed upon those who have taken their first steps into the realm of ascension.',
      rarity: 'common',
      requirements: { tier: 'initiate' },
      titleText: 'The Awakened',
      titleColor: '#87CEEB',
      category: 'initiate_collection',
      iconUrl: '/icons/titles/the_awakened.png'
    });

    this.rewards.push(prologue, basicAura, noviceCloak, awakened);
  }

  /**
   * Ascendant Tier Rewards (Prestige 2-4)
   */
  async seedAscendantRewards() {
    // Story Arc
    const ascendantChronicles = await PrestigeReward.createStoryArc({
      name: 'Ascendant Chronicles: Paths of Power',
      description: 'Discover the ancient techniques and forgotten wisdom of those who walked the path of ascension before you.',
      rarity: 'rare',
      requirements: { tier: 'ascendant' },
      storyArcId: 'ascendant_chronicles',
      chapterCount: 8,
      estimatedPlaytime: 480, // 8 hours
      narrativeBranches: ['path_of_wisdom', 'path_of_strength', 'path_of_harmony'],
      category: 'ascendant_collection',
      iconUrl: '/icons/story/ascendant_chronicles.png'
    });

    // Advanced Cosmetics
    const ascendantCloak = await PrestigeReward.createCosmetic({
      name: 'Cloak of Rising Stars',
      description: 'A magnificent cloak that seems to hold the very essence of starlight within its fabric.',
      rarity: 'rare',
      requirements: { tier: 'ascendant' },
      cosmeticId: 'cloak_rising_stars',
      slot: 'cloak',
      visualEffects: ['starlight_shimmer', 'constellation_patterns', 'gentle_pulsing'],
      customizationOptions: { 
        constellations: ['ursa_major', 'orion', 'cassiopeia'],
        colors: ['cosmic_blue', 'stellar_silver', 'nebula_purple']
      },
      category: 'ascendant_collection',
      iconUrl: '/icons/cosmetics/cloak_stars.png'
    });

    const etherealWeapons = await PrestigeReward.createCosmetic({
      name: 'Ethereal Weapon Enchantments',
      description: 'Weapon effects that channel the power of the ethereal realm, visible to all who witness your prowess.',
      rarity: 'rare',
      requirements: { tier: 'ascendant' },
      cosmeticId: 'weapons_ethereal',
      slot: 'weapon_effect',
      visualEffects: ['ethereal_trail', 'spirit_wisps', 'energy_resonance'],
      category: 'ascendant_collection',
      iconUrl: '/icons/cosmetics/ethereal_weapons.png'
    });

    // Titles
    const scholar = await PrestigeReward.createTitle({
      name: 'Ascendant Scholar',
      description: 'Recognition of deep study into the mysteries of ascension.',
      rarity: 'rare',
      requirements: { tier: 'ascendant', season_points: 1000 },
      titleText: 'Ascendant Scholar',
      titleColor: '#DDA0DD',
      category: 'ascendant_collection'
    });

    const realmWalker = await PrestigeReward.createTitle({
      name: 'Realm Walker',
      description: 'For those who have explored the deepest mysteries of multiple realms.',
      rarity: 'rare',
      requirements: { tier: 'ascendant', season_points: 1500 },
      titleText: 'Realm Walker',
      titleColor: '#98FB98',
      category: 'ascendant_collection'
    });

    // Special Ability
    const customTemplates = await PrestigeReward.createAbility({
      name: 'Custom World Templates',
      description: 'Unlock the ability to create and share custom world templates with advanced features.',
      rarity: 'rare',
      requirements: { tier: 'ascendant' },
      abilityId: 'custom_world_templates',
      abilityType: 'passive',
      mechanicsDescription: 'Access to advanced world creation tools and template sharing system',
      category: 'ascendant_collection'
    });

    this.rewards.push(ascendantChronicles, ascendantCloak, etherealWeapons, scholar, realmWalker, customTemplates);
  }

  /**
   * Luminary Tier Rewards (Prestige 5-9)
   */
  async seedLuminaryRewards() {
    // Epic Story Arc
    const luminarySaga = await PrestigeReward.createStoryArc({
      name: 'Luminary Saga: The Celestial Awakening',
      description: 'Experience the legendary tales of the first Luminaries and their struggle against the void itself.',
      rarity: 'epic',
      requirements: { tier: 'luminary' },
      storyArcId: 'luminary_saga',
      chapterCount: 15,
      estimatedPlaytime: 900, // 15 hours
      narrativeBranches: ['light_guardian', 'shadow_hunter', 'balance_keeper'],
      exclusiveCharacters: ['Master Aurelius', 'Shadow Sage Nyx', 'The First Luminary'],
      category: 'luminary_collection',
      iconUrl: '/icons/story/luminary_saga.png'
    });

    // Legendary Cosmetics
    const luminaryCrown = await PrestigeReward.createCosmetic({
      name: 'Crown of Infinite Light',
      description: 'A radiant crown that marks the wearer as one who has mastered the fundamental forces of creation.',
      rarity: 'epic',
      requirements: { tier: 'luminary' },
      cosmeticId: 'crown_infinite_light',
      slot: 'headpiece',
      visualEffects: ['radiant_beams', 'particle_cascade', 'light_refraction'],
      category: 'luminary_collection',
      iconUrl: '/icons/cosmetics/crown_light.png'
    });

    const celestialMount = await PrestigeReward.createCosmetic({
      name: 'Celestial Phoenix Mount',
      description: 'A magnificent phoenix companion that soars alongside you, its flames never dimming.',
      rarity: 'epic',
      requirements: { tier: 'luminary', season_points: 5000 },
      cosmeticId: 'mount_celestial_phoenix',
      slot: 'mount',
      visualEffects: ['phoenix_flames', 'wing_trails', 'rebirth_aura'],
      category: 'luminary_collection',
      iconUrl: '/icons/cosmetics/phoenix_mount.png'
    });

    // Master Titles
    const luminaryMaster = await PrestigeReward.createTitle({
      name: 'Luminary Master',
      description: 'A title reserved for those who have achieved true mastery over light and shadow.',
      rarity: 'epic',
      requirements: { tier: 'luminary' },
      titleText: 'Luminary Master',
      titleColor: '#FFD700',
      titleEffects: ['golden_glow', 'light_particles'],
      category: 'luminary_collection'
    });

    const starTouched = await PrestigeReward.createTitle({
      name: 'Star Touched',
      description: 'For those whose achievements have reached the very heavens.',
      rarity: 'epic',
      requirements: { tier: 'luminary', prestige_level: 7 },
      titleText: 'Star Touched',
      titleColor: '#E6E6FA',
      titleEffects: ['starlight_shimmer'],
      category: 'luminary_collection'
    });

    // Advanced Abilities
    const betaAccess = await PrestigeReward.createAbility({
      name: 'Beta Feature Access',
      description: 'Early access to experimental features and new content before public release.',
      rarity: 'epic',
      requirements: { tier: 'luminary' },
      abilityId: 'beta_feature_access',
      abilityType: 'passive',
      mechanicsDescription: 'Access to beta testing programs and unreleased features',
      category: 'luminary_collection'
    });

    const aiPersonalities = await PrestigeReward.createAbility({
      name: 'AI Personality Creation',
      description: 'Design custom AI personalities for NPCs and companions in your worlds.',
      rarity: 'epic',
      requirements: { tier: 'luminary', season_points: 3000 },
      abilityId: 'ai_personality_creation',
      abilityType: 'active',
      mechanicsDescription: 'Advanced AI customization tools for creating unique NPC personalities',
      category: 'luminary_collection'
    });

    this.rewards.push(luminarySaga, luminaryCrown, celestialMount, luminaryMaster, starTouched, betaAccess, aiPersonalities);
  }

  /**
   * Transcendent Tier Rewards (Prestige 10-14)
   */
  async seedTranscendentRewards() {
    // Legendary Story Arc
    const transcendentMysteries = await PrestigeReward.createStoryArc({
      name: 'Transcendent Mysteries: Beyond the Veil',
      description: 'Uncover the ultimate secrets of reality itself and the forces that shape all existence.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent' },
      storyArcId: 'transcendent_mysteries',
      chapterCount: 25,
      estimatedPlaytime: 1500, // 25 hours
      narrativeBranches: ['reality_shaper', 'void_walker', 'existence_guardian'],
      exclusiveCharacters: ['The Architect', 'Void Empress', 'Reality\'s Echo'],
      category: 'transcendent_collection',
      iconUrl: '/icons/story/transcendent_mysteries.png'
    });

    // Reality-Altering Cosmetics
    const transcendentForm = await PrestigeReward.createCosmetic({
      name: 'Transcendent Manifestation',
      description: 'A form that exists partially beyond physical reality, showcasing mastery over existence itself.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent' },
      cosmeticId: 'form_transcendent',
      slot: 'full_body_effect',
      visualEffects: ['reality_distortion', 'dimensional_shift', 'existence_flux'],
      category: 'transcendent_collection',
      iconUrl: '/icons/cosmetics/transcendent_form.png'
    });

    const realityWarper = await PrestigeReward.createCosmetic({
      name: 'Reality Warper Effects',
      description: 'Environmental effects that bend reality around your presence.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent', season_points: 10000 },
      cosmeticId: 'effects_reality_warper',
      slot: 'environmental_effect',
      visualEffects: ['space_distortion', 'time_ripples', 'matter_flux'],
      category: 'transcendent_collection',
      iconUrl: '/icons/cosmetics/reality_effects.png'
    });

    // Transcendent Titles
    const transcendentOne = await PrestigeReward.createTitle({
      name: 'The Transcendent One',
      description: 'Reserved for those who have moved beyond mortal limitations.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent' },
      titleText: 'The Transcendent One',
      titleColor: '#FF1493',
      titleEffects: ['reality_shimmer', 'dimensional_glow'],
      displayPriority: 10,
      category: 'transcendent_collection'
    });

    const realityShaper = await PrestigeReward.createTitle({
      name: 'Reality Shaper',
      description: 'For those whose will can alter the very fabric of existence.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent', prestige_level: 12 },
      titleText: 'Reality Shaper',
      titleColor: '#8A2BE2',
      titleEffects: ['reality_pulse'],
      category: 'transcendent_collection'
    });

    // Transcendent Abilities
    const devCollaboration = await PrestigeReward.createAbility({
      name: 'Developer Collaboration',
      description: 'Direct communication channel with the development team for feedback and collaboration.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent' },
      abilityId: 'developer_collaboration',
      abilityType: 'passive',
      mechanicsDescription: 'Access to developer chat channels and influence on game development',
      category: 'transcendent_collection'
    });

    const communityEvents = await PrestigeReward.createAbility({
      name: 'Community Event Hosting',
      description: 'Tools and permissions to host official community events and tournaments.',
      rarity: 'legendary',
      requirements: { tier: 'transcendent', season_points: 7500 },
      abilityId: 'community_event_hosting',
      abilityType: 'active',
      mechanicsDescription: 'Event creation tools and official hosting capabilities',
      category: 'transcendent_collection'
    });

    this.rewards.push(transcendentMysteries, transcendentForm, realityWarper, transcendentOne, realityShaper, devCollaboration, communityEvents);
  }

  /**
   * Eternal Tier Rewards (Prestige 15-20)
   */
  async seedEternalRewards() {
    // Mythic Story Arc
    const eternalCodex = await PrestigeReward.createStoryArc({
      name: 'The Eternal Codex: Origin of All Things',
      description: 'The ultimate narrative experience, revealing the true origin and purpose of all existence.',
      rarity: 'mythic',
      requirements: { tier: 'eternal' },
      storyArcId: 'eternal_codex',
      chapterCount: 50,
      estimatedPlaytime: 3000, // 50 hours
      narrativeBranches: ['creator_path', 'destroyer_path', 'preserver_path'],
      exclusiveCharacters: ['The Prime Creator', 'The Final Entropy', 'The Eternal Balance'],
      category: 'eternal_collection',
      iconUrl: '/icons/story/eternal_codex.png'
    });

    // Mythic Cosmetics
    const eternalManifestation = await PrestigeReward.createCosmetic({
      name: 'Eternal Manifestation',
      description: 'The ultimate expression of power - a form that transcends all limitations of reality.',
      rarity: 'mythic',
      requirements: { tier: 'eternal' },
      cosmeticId: 'manifestation_eternal',
      slot: 'legendary_transformation',
      visualEffects: ['existence_mastery', 'infinite_radiance', 'reality_command'],
      category: 'eternal_collection',
      iconUrl: '/icons/cosmetics/eternal_manifestation.png'
    });

    const universeCreator = await PrestigeReward.createCosmetic({
      name: 'Universe Creator Tools',
      description: 'Visual tools that demonstrate your mastery over the fundamental forces of creation.',
      rarity: 'mythic',
      requirements: { tier: 'eternal', prestige_level: 18 },
      cosmeticId: 'tools_universe_creator',
      slot: 'creation_effects',
      visualEffects: ['cosmic_manipulation', 'reality_forge', 'existence_weaving'],
      category: 'eternal_collection',
      iconUrl: '/icons/cosmetics/universe_tools.png'
    });

    // Eternal Titles
    const eternalGuardian = await PrestigeReward.createTitle({
      name: 'Eternal Guardian',
      description: 'Protector of reality itself, guardian of the infinite realms.',
      rarity: 'mythic',
      requirements: { tier: 'eternal' },
      titleText: 'Eternal Guardian',
      titleColor: '#FFD700',
      titleEffects: ['eternal_aura', 'guardian_presence'],
      displayPriority: 100,
      category: 'eternal_collection'
    });

    const universeArchitect = await PrestigeReward.createTitle({
      name: 'Universe Architect',
      description: 'The ultimate achievement - recognized as a creator of worlds and realities.',
      rarity: 'mythic',
      requirements: { tier: 'eternal', prestige_level: 20 },
      titleText: 'Universe Architect',
      titleColor: '#8B008B',
      titleEffects: ['creation_mastery', 'architect_glow'],
      displayPriority: 1000,
      category: 'eternal_collection'
    });

    // Eternal Abilities
    const loreContribution = await PrestigeReward.createAbility({
      name: 'Official Lore Contribution',
      description: 'Ability to contribute to the official game lore and have your creations become canon.',
      rarity: 'mythic',
      requirements: { tier: 'eternal' },
      abilityId: 'lore_contribution',
      abilityType: 'passive',
      mechanicsDescription: 'Official recognition and integration of player-created lore',
      category: 'eternal_collection'
    });

    const eternalLegacy = await PrestigeReward.createAbility({
      name: 'Eternal Legacy Creation',
      description: 'Create permanent memorials and monuments in the game world that will exist forever.',
      rarity: 'mythic',
      requirements: { tier: 'eternal', prestige_level: 20 },
      abilityId: 'eternal_legacy_creation',
      abilityType: 'active',
      mechanicsDescription: 'Tools to create permanent world features and player memorials',
      category: 'eternal_collection'
    });

    this.rewards.push(eternalCodex, eternalManifestation, universeCreator, eternalGuardian, universeArchitect, loreContribution, eternalLegacy);
  }

  /**
   * Seasonal Rewards (Reset each season)
   */
  async seedSeasonalRewards() {
    // Winter 2025 Seasonal Rewards
    const winterExplorerSet = await PrestigeReward.createCosmetic({
      name: 'Winter Explorer\'s Garb',
      description: 'Exclusive seasonal outfit for the Winter of Ascension season.',
      rarity: 'rare',
      requirements: { season_points: 2500 },
      cosmeticId: 'set_winter_explorer_2025',
      slot: 'outfit_set',
      visualEffects: ['frost_breath', 'ice_crystals', 'winter_aura'],
      category: 'seasonal_winter_2025',
      is_seasonal: true,
      season_id: 'season_2025_winter',
      iconUrl: '/icons/seasonal/winter_explorer.png'
    });

    const frostMaster = await PrestigeReward.createTitle({
      name: 'Frost Master',
      description: 'Awarded to dedicated participants in the Winter of Ascension season.',
      rarity: 'rare',
      requirements: { season_points: 5000 },
      titleText: 'Frost Master',
      titleColor: '#B0E0E6',
      titleEffects: ['frost_particles'],
      category: 'seasonal_winter_2025',
      is_seasonal: true,
      season_id: 'season_2025_winter'
    });

    this.rewards.push(winterExplorerSet, frostMaster);
  }

  /**
   * Clear all existing rewards (for development/testing)
   */
  async clearAllRewards() {
    await PrestigeReward.destroy({ where: {} });
    console.log('Cleared all prestige rewards');
  }
}

module.exports = PrestigeRewardSeeder;