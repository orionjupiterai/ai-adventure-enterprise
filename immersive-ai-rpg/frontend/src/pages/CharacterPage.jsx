import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@store';

const CharacterPage = () => {
  const navigate = useNavigate();
  const { player } = usePlayerStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark-300 to-game-dark-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-game font-bold mb-6 text-gradient">Character Sheet</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Character Info</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Name:</span> {player?.name || 'Unknown'}</p>
              <p><span className="text-gray-400">Class:</span> {player?.class || 'Unknown'}</p>
              <p><span className="text-gray-400">Level:</span> {player?.level || 1}</p>
              <p><span className="text-gray-400">Experience:</span> {player?.experience || 0}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Stats</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">HP:</span> {player?.hp_current || 100} / {player?.hp_max || 100}</p>
              <p><span className="text-gray-400">Mana:</span> {player?.mana_current || 50} / {player?.mana_max || 50}</p>
              <p><span className="text-gray-400">Gold:</span> {player?.gold || 0}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/game')}
          className="btn-primary mt-6"
        >
          Back to Game
        </button>
      </motion.div>
    </div>
  );
};

export default CharacterPage;