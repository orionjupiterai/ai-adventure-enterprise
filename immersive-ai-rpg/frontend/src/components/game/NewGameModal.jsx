import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { gameAPI } from '@services/api/game';
import toast from 'react-hot-toast';

const NewGameModal = ({ onClose, onStart }) => {
  const [step, setStep] = useState(1); // 1: World, 2: Character, 3: Difficulty
  const [worldConfig, setWorldConfig] = useState({});
  const [characterData, setCharacterData] = useState({});
  
  const worldThemes = [
    { id: 'fantasy', name: 'Fantasy', icon: '🏰', description: 'Swords, sorcery, and mythical creatures' },
    { id: 'scifi', name: 'Sci-Fi', icon: '🚀', description: 'Space exploration and futuristic technology' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon-lit dystopia and cyber augmentations' },
    { id: 'horror', name: 'Horror', icon: '👻', description: 'Survive unspeakable terrors' },
  ];

  const characterClasses = {
    fantasy: [
      { id: 'warrior', name: 'Warrior', icon: '⚔️', stats: { str: 15, dex: 10, int: 8, wis: 10, cha: 8 } },
      { id: 'mage', name: 'Mage', icon: '🔮', stats: { str: 8, dex: 10, int: 15, wis: 12, cha: 10 } },
      { id: 'rogue', name: 'Rogue', icon: '🗡️', stats: { str: 10, dex: 15, int: 10, wis: 8, cha: 12 } },
      { id: 'cleric', name: 'Cleric', icon: '✨', stats: { str: 10, dex: 8, int: 10, wis: 15, cha: 12 } },
    ],
    scifi: [
      { id: 'soldier', name: 'Soldier', icon: '🔫', stats: { str: 14, dex: 12, int: 10, wis: 10, cha: 8 } },
      { id: 'engineer', name: 'Engineer', icon: '🔧', stats: { str: 8, dex: 10, int: 15, wis: 12, cha: 10 } },
      { id: 'pilot', name: 'Pilot', icon: '✈️', stats: { str: 10, dex: 15, int: 12, wis: 10, cha: 8 } },
      { id: 'scientist', name: 'Scientist', icon: '🧪', stats: { str: 8, dex: 8, int: 15, wis: 15, cha: 10 } },
    ],
    cyberpunk: [
      { id: 'hacker', name: 'Hacker', icon: '💻', stats: { str: 8, dex: 12, int: 15, wis: 12, cha: 10 } },
      { id: 'street_samurai', name: 'Street Samurai', icon: '🥷', stats: { str: 14, dex: 15, int: 10, wis: 8, cha: 8 } },
      { id: 'corpo', name: 'Corporate', icon: '💼', stats: { str: 8, dex: 10, int: 12, wis: 10, cha: 15 } },
      { id: 'netrunner', name: 'Netrunner', icon: '🧠', stats: { str: 8, dex: 10, int: 15, wis: 15, cha: 8 } },
    ],
    horror: [
      { id: 'investigator', name: 'Investigator', icon: '🔍', stats: { str: 10, dex: 10, int: 15, wis: 12, cha: 10 } },
      { id: 'survivor', name: 'Survivor', icon: '🏃', stats: { str: 12, dex: 14, int: 10, wis: 12, cha: 8 } },
      { id: 'occultist', name: 'Occultist', icon: '📖', stats: { str: 8, dex: 8, int: 14, wis: 15, cha: 12 } },
      { id: 'soldier', name: 'Ex-Military', icon: '🎖️', stats: { str: 14, dex: 12, int: 10, wis: 10, cha: 10 } },
    ],
  };

  const difficulties = [
    { id: 'novice', name: 'Novice', description: 'Forgiving gameplay for new adventurers' },
    { id: 'standard', name: 'Standard', description: 'Balanced challenge for most players' },
    { id: 'veteran', name: 'Veteran', description: 'Tough battles and limited resources' },
    { id: 'master', name: 'Master', description: 'Unforgiving world for experts only' },
  ];

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleWorldSelect = (theme) => {
    setWorldConfig({ theme: theme.id, themeName: theme.name });
    setStep(2);
  };

  const handleCharacterSubmit = (data) => {
    setCharacterData(data);
    setStep(3);
  };

  const handleStartGame = async (difficulty) => {
    try {
      const gameConfig = {
        worldConfig: {
          ...worldConfig,
          difficulty,
        },
        characterData,
      };

      await gameAPI.startGame(gameConfig);
      toast.success('Starting your adventure...');
      onStart();
    } catch (error) {
      toast.error('Failed to start game');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-game-dark-100 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-game-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-game font-bold">
            {step === 1 && 'Choose Your World'}
            {step === 2 && 'Create Your Character'}
            {step === 3 && 'Select Difficulty'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: World Selection */}
          {step === 1 && (
            <motion.div
              key="world"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {worldThemes.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWorldSelect(theme)}
                  className="bg-game-dark-200 rounded-lg p-6 text-left hover:bg-game-primary/10 transition-all duration-200 border border-gray-700 hover:border-game-primary/50 group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-5xl">{theme.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-game-primary transition-colors">
                        {theme.name}
                      </h3>
                      <p className="text-gray-400">{theme.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Character Creation */}
          {step === 2 && (
            <motion.form
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit(handleCharacterSubmit)}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Character Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter your character's name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Choose Your Class</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characterClasses[worldConfig.theme]?.map((cls) => (
                    <label
                      key={cls.id}
                      className="bg-game-dark-200 rounded-lg p-4 cursor-pointer hover:bg-game-primary/10 transition-all duration-200 border-2 border-gray-700 hover:border-game-primary/50 has-[:checked]:border-game-primary has-[:checked]:bg-game-primary/20"
                    >
                      <input
                        type="radio"
                        value={cls.id}
                        className="sr-only"
                        {...register('class', { required: 'Please select a class' })}
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{cls.icon}</span>
                        <div>
                          <h4 className="font-bold">{cls.name}</h4>
                          <div className="text-xs text-gray-400 mt-1">
                            STR: {cls.stats.str} | DEX: {cls.stats.dex} | INT: {cls.stats.int}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.class && (
                  <p className="text-red-400 text-sm mt-1">{errors.class.message}</p>
                )}
              </div>

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary px-6 py-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2"
                >
                  Continue
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: Difficulty Selection */}
          {step === 3 && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {difficulties.map((diff) => (
                <motion.button
                  key={diff.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartGame(diff.id)}
                  className="w-full bg-game-dark-200 rounded-lg p-6 text-left hover:bg-game-primary/10 transition-all duration-200 border border-gray-700 hover:border-game-primary/50 group"
                >
                  <h3 className="text-xl font-bold mb-2 group-hover:text-game-primary transition-colors">
                    {diff.name}
                  </h3>
                  <p className="text-gray-400">{diff.description}</p>
                </motion.button>
              ))}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary w-full mt-6"
              >
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default NewGameModal;