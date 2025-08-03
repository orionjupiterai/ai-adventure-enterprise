import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useGameStore } from '@store';
import { gameAPI } from '@services/api/game';
import LoadGameModal from '@components/game/LoadGameModal';
import NewGameModal from '@components/game/NewGameModal';
import toast from 'react-hot-toast';

const GameMenuPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { gameState, resumeGame } = useGameStore();
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [saves, setSaves] = useState([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [hasContinueOption, setHasContinueOption] = useState(false);

  useEffect(() => {
    // Check if there's an active game session
    checkActiveSession();
    // Load saved games
    loadSavedGames();
  }, []);

  const checkActiveSession = async () => {
    try {
      const activeGame = await gameAPI.getActiveSession();
      if (activeGame) {
        setHasContinueOption(true);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }
  };

  const loadSavedGames = async () => {
    setIsLoadingSaves(true);
    try {
      const savedGames = await gameAPI.getSaves();
      setSaves(savedGames);
    } catch (error) {
      toast.error('Failed to load saved games');
    } finally {
      setIsLoadingSaves(false);
    }
  };

  const handleContinue = async () => {
    try {
      await resumeGame();
      navigate('/game');
    } catch (error) {
      toast.error('Failed to continue game');
    }
  };

  const handleNewGame = () => {
    setShowNewGameModal(true);
  };

  const handleLoadGame = () => {
    setShowLoadModal(true);
  };

  const handleQuit = () => {
    logout();
    navigate('/');
  };

  const menuOptions = [
    {
      id: 'continue',
      title: 'Continue',
      description: 'Resume your adventure',
      icon: '⚔️',
      action: handleContinue,
      disabled: !hasContinueOption,
      hidden: !hasContinueOption,
    },
    {
      id: 'new',
      title: 'New Game',
      description: 'Start a fresh adventure',
      icon: '🌟',
      action: handleNewGame,
    },
    {
      id: 'load',
      title: 'Load Game',
      description: 'Load a saved adventure',
      icon: '📂',
      action: handleLoadGame,
      disabled: saves.length === 0,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your experience',
      icon: '⚙️',
      action: () => navigate('/settings'),
    },
    {
      id: 'quit',
      title: 'Quit',
      description: 'Return to main menu',
      icon: '🚪',
      action: handleQuit,
      variant: 'danger',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark-300 to-game-dark-200 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-game-primary/10 via-transparent to-transparent"></div>
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-4xl w-full"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-game font-bold mb-4 text-gradient">
            Game Menu
          </h1>
          <p className="text-xl text-gray-300">
            Welcome back, {user?.username || 'Adventurer'}
          </p>
        </motion.div>

        {/* Menu Options */}
        <div className="grid gap-4 md:gap-6">
          <AnimatePresence>
            {menuOptions
              .filter(option => !option.hidden)
              .map((option, index) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: option.disabled ? 1 : 1.02, x: option.disabled ? 0 : 10 }}
                  whileTap={{ scale: option.disabled ? 1 : 0.98 }}
                  onClick={option.action}
                  disabled={option.disabled}
                  className={`
                    relative group text-left p-6 rounded-xl transition-all duration-300
                    ${option.disabled 
                      ? 'bg-game-dark-100/50 cursor-not-allowed opacity-50' 
                      : option.variant === 'danger'
                        ? 'bg-game-dark-100 hover:bg-red-900/20 hover:border-red-500/50'
                        : 'bg-game-dark-100 hover:bg-game-primary/10 hover:border-game-primary/50'
                    }
                    border border-gray-800 hover:shadow-2xl
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{option.icon}</span>
                      <div>
                        <h3 className={`text-2xl font-bold mb-1 ${
                          option.variant === 'danger' ? 'group-hover:text-red-400' : 'group-hover:text-game-primary'
                        } transition-colors`}>
                          {option.title}
                        </h3>
                        <p className="text-gray-400">{option.description}</p>
                      </div>
                    </div>
                    {!option.disabled && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="text-3xl text-gray-600 group-hover:text-game-primary transition-colors"
                      >
                        →
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
          </AnimatePresence>
        </div>

        {/* Quick Stats */}
        {hasContinueOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-game-dark-100/50 rounded-lg border border-gray-800"
          >
            <div className="flex justify-around text-center">
              <div>
                <p className="text-gray-400 text-sm">Level</p>
                <p className="text-xl font-bold">{gameState?.player?.level || 1}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Play Time</p>
                <p className="text-xl font-bold">{gameState?.playTime || '0h 0m'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-xl font-bold">{gameState?.location?.name || 'Unknown'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Load Game Modal */}
      <AnimatePresence>
        {showLoadModal && (
          <LoadGameModal
            saves={saves}
            onClose={() => setShowLoadModal(false)}
            onLoad={(saveId) => {
              // Handle loading the game
              navigate('/game');
            }}
          />
        )}
      </AnimatePresence>

      {/* New Game Modal */}
      <AnimatePresence>
        {showNewGameModal && (
          <NewGameModal
            onClose={() => setShowNewGameModal(false)}
            onStart={() => {
              navigate('/game');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameMenuPage;