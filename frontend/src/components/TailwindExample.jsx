import React from 'react';

const TailwindExample = () => {
  return (
    <div className="min-h-screen bg-adventure-gradient p-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-6xl font-fantasy text-center text-gradient mb-8 text-shadow-lg">
          Adventure Platform
        </h1>
        
        {/* Card Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="adventure-card">
            <h2 className="text-2xl font-fantasy text-adventure-accent mb-4">
              Choose Your Path
            </h2>
            <p className="text-gray-300 mb-4">
              Every decision shapes your destiny in this epic adventure.
            </p>
            <button className="btn-primary w-full">
              Begin Journey
            </button>
          </div>
          
          <div className="adventure-card floating">
            <h2 className="text-2xl font-fantasy text-blue-400 mb-4">
              Mystical Items
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="inventory-slot">
                <span className="text-2xl">⚔️</span>
              </div>
              <div className="inventory-slot">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="inventory-slot">
                <span className="text-2xl">🧪</span>
              </div>
            </div>
            <button className="btn-secondary w-full">
              View Inventory
            </button>
          </div>
          
          <div className="adventure-card">
            <h2 className="text-2xl font-fantasy text-green-400 mb-4">
              Character Stats
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health</span>
                  <span>80/100</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-fill health-bar-fill" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Mana</span>
                  <span>60/100</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-fill mana-bar-fill" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game Panel Example */}
        <div className="game-panel mb-8">
          <h3 className="text-xl font-fantasy text-adventure-accent mb-4">
            Current Scene
          </h3>
          <div className="dialogue-box mb-4">
            <p>
              You stand at the entrance of the Crystal Cavern. 
              The air shimmers with magical energy, and distant echoes 
              suggest you're not alone...
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="choice-button btn-ghost">
              🔦 Enter cautiously with torch
            </button>
            <button className="choice-button btn-ghost">
              ⚡ Cast light spell and proceed
            </button>
            <button className="choice-button btn-ghost">
              👂 Listen for sounds first
            </button>
            <button className="choice-button btn-ghost">
              ↩️ Return to the forest
            </button>
          </div>
        </div>
        
        {/* Form Example */}
        <div className="adventure-card glass max-w-md mx-auto">
          <h3 className="text-2xl font-fantasy text-center mb-6">
            Join the Adventure
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Character Name
              </label>
              <input 
                type="text" 
                className="adventure-input w-full"
                placeholder="Enter your hero's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Choose Your Class
              </label>
              <select className="adventure-input w-full">
                <option>Warrior</option>
                <option>Mage</option>
                <option>Rogue</option>
                <option>Ranger</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              Create Character
            </button>
          </form>
        </div>
        
        {/* Loading Example */}
        <div className="text-center mt-12">
          <div className="spinner mb-4"></div>
          <p className="text-gray-400">Loading your adventure...</p>
        </div>
      </div>
    </div>
  );
};

export default TailwindExample;