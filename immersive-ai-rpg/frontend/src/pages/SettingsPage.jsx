import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@store';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
    toast.success('Settings updated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark-300 to-game-dark-200 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-game font-bold mb-6 text-gradient">Settings</h1>
        
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Audio</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Master Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings?.masterVolume || 50}
                  onChange={(e) => handleSettingChange('masterVolume', e.target.value)}
                  className="w-48"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Sound Effects</span>
                <input
                  type="checkbox"
                  checked={settings?.soundEnabled || true}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Music</span>
                <input
                  type="checkbox"
                  checked={settings?.musicEnabled || true}
                  onChange={(e) => handleSettingChange('musicEnabled', e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
            </div>
          </div>

          {/* Gameplay Settings */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Gameplay</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Auto-Save</span>
                <input
                  type="checkbox"
                  checked={settings?.autoSave || true}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Show Hints</span>
                <input
                  type="checkbox"
                  checked={settings?.showHints || true}
                  onChange={(e) => handleSettingChange('showHints', e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Text Speed</span>
                <select
                  value={settings?.textSpeed || 'normal'}
                  onChange={(e) => handleSettingChange('textSpeed', e.target.value)}
                  className="bg-game-dark-200 px-4 py-2 rounded"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                  <option value="instant">Instant</option>
                </select>
              </label>
            </div>
          </div>

          {/* Display Settings */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Display</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Theme</span>
                <select
                  value={settings?.theme || 'dark'}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="bg-game-dark-200 px-4 py-2 rounded"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Show FPS</span>
                <input
                  type="checkbox"
                  checked={settings?.showFPS || false}
                  onChange={(e) => handleSettingChange('showFPS', e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/menu')}
          className="btn-primary mt-6"
        >
          Back to Menu
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;