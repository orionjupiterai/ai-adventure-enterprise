import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WorldBuilderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark-300 to-game-dark-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-game font-bold mb-6 text-gradient">World Builder</h1>
        <div className="card">
          <p className="text-gray-400 mb-4">
            The World Builder feature is coming soon! This will allow you to create custom worlds with unique themes, locations, and adventures.
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="btn-primary"
          >
            Back to Menu
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WorldBuilderPage;