import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useGameStore } from '@store';
import toast from 'react-hot-toast';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pauseGame, saveGame } = useGameStore();

  const handleSave = async () => {
    try {
      await saveGame();
      toast.success('Game saved!');
    } catch (error) {
      toast.error('Failed to save game');
    }
  };

  const handleMenu = () => {
    pauseGame();
    navigate('/menu');
  };

  return (
    <header className="h-16 bg-game-dark-200 border-b border-gray-800">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-game font-bold text-gradient">Immersive AI RPG</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-400">Playing as: {user?.username}</span>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Save
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMenu}
            className="btn-primary px-4 py-2 text-sm"
          >
            Menu
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;