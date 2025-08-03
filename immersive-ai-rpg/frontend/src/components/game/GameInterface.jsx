import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@store';
import { useWebSocket } from '@hooks/useWebSocket';
import StatusBar from './StatusBar';
import CommandInput from './CommandInput';
import NarrativeDisplay from './NarrativeDisplay';
import SceneVisualizer from './SceneVisualizer';
import GameHistory from './GameHistory';
import CombatInterface from '../combat/CombatInterface';
import NPCInteraction from '../world/NPCInteraction';
import LoadingSpinner from '../ui/LoadingSpinner';

const GameInterface = () => {
  const { 
    gameState, 
    isLoading, 
    currentScene,
    combatActive,
    npcInteraction 
  } = useGameStore();
  
  const { connected, sendMessage } = useWebSocket();
  const [showHistory, setShowHistory] = useState(false);

  const handleCommand = (command) => {
    if (connected) {
      sendMessage({
        type: 'PLAYER_ACTION',
        payload: { command, timestamp: Date.now() }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="game-interface h-screen flex flex-col bg-gradient-dark">
      <StatusBar />
      
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Scene Visualization */}
          <motion.div 
            className="h-1/2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SceneVisualizer scene={currentScene} />
          </motion.div>

          {/* Narrative/Combat/NPC Area */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {combatActive ? (
                <motion.div
                  key="combat"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="h-full"
                >
                  <CombatInterface />
                </motion.div>
              ) : npcInteraction ? (
                <motion.div
                  key="npc"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="h-full"
                >
                  <NPCInteraction npc={npcInteraction} />
                </motion.div>
              ) : (
                <motion.div
                  key="narrative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <NarrativeDisplay />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Command Input */}
          <CommandInput onCommand={handleCommand} disabled={combatActive} />
        </div>

        {/* Side Panel */}
        <motion.div 
          className="w-80 flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 text-game-primary">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Location:</span>
                <span>{gameState?.location?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time:</span>
                <span>{gameState?.worldTime || 'Day'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weather:</span>
                <span>{gameState?.weather || 'Clear'}</span>
              </div>
            </div>
          </div>

          {/* Game History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary w-full"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>

          {/* Connection Status */}
          <div className="mt-auto">
            <div className={`text-sm px-3 py-2 rounded-lg text-center ${
              connected ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* History Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="absolute inset-x-0 bottom-0 h-96 bg-game-dark-100/95 backdrop-blur-sm border-t border-gray-700"
          >
            <GameHistory onClose={() => setShowHistory(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameInterface;