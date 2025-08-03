import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const LoadGameModal = ({ saves, onClose, onLoad }) => {
  const handleLoad = async (saveId) => {
    try {
      await onLoad(saveId);
      toast.success('Game loaded successfully!');
    } catch (error) {
      toast.error('Failed to load game');
    }
  };

  const handleDelete = async (saveId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this save?')) {
      try {
        // Delete save logic here
        toast.success('Save deleted');
      } catch (error) {
        toast.error('Failed to delete save');
      }
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
        className="bg-game-dark-100 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-hidden border border-game-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-game font-bold">Load Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {saves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No saved games found</p>
              <p className="text-gray-500 mt-2">Start a new adventure!</p>
            </div>
          ) : (
            saves.map((save) => (
              <motion.div
                key={save.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLoad(save.id)}
                className="bg-game-dark-200 rounded-lg p-6 cursor-pointer hover:bg-game-primary/10 transition-all duration-200 border border-gray-700 hover:border-game-primary/50 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-game-primary transition-colors">
                      {save.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Character</p>
                        <p className="font-medium">{save.characterName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Level</p>
                        <p className="font-medium">{save.level}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium">{save.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Play Time</p>
                        <p className="font-medium">{save.playTime || '0h 0m'}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      Saved {format(new Date(save.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(save.id, e)}
                    className="ml-4 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete save"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadGameModal;