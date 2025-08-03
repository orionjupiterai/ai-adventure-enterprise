import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@components/auth/LoginForm';
import RegisterForm from '@components/auth/RegisterForm';

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const navigate = useNavigate();

  const features = [
    {
      title: 'AI-Powered Storytelling',
      description: 'Experience unique narratives that adapt to your choices in real-time',
      icon: '🎭'
    },
    {
      title: 'Dynamic World Generation',
      description: 'Explore procedurally generated worlds with rich lore and history',
      icon: '🌍'
    },
    {
      title: 'Intelligent NPCs',
      description: 'Interact with characters that remember and react to your actions',
      icon: '🤖'
    },
    {
      title: 'Multiple Genres',
      description: 'Choose from fantasy, sci-fi, cyberpunk, or horror adventures',
      icon: '🎮'
    }
  ];

  const handleAuthSuccess = () => {
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-dark-300 to-game-dark-200 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-game-primary/20 via-transparent to-transparent"></div>
        
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-game-primary/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl font-game font-bold mb-6 text-gradient">
              Immersive AI RPG
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
              Embark on infinite adventures powered by advanced AI. Every choice shapes your unique story.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAuth(true)}
              className="btn-primary text-lg px-8 py-4 rounded-full font-semibold shadow-2xl"
            >
              Begin Your Adventure
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl font-game font-bold text-center mb-16"
        >
          Forge Your Legend
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card hover:shadow-2xl hover:border-game-primary/50 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-game-primary">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-game-primary/20 to-game-secondary/20 rounded-3xl p-12 backdrop-blur-sm border border-game-primary/30"
        >
          <h2 className="text-3xl md:text-4xl font-game font-bold mb-6">
            Ready to Write Your Story?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of adventurers in a world where every decision matters and every story is unique.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuth(true)}
            className="btn-secondary text-lg px-8 py-4 rounded-full font-semibold"
          >
            Play Now - It's Free
          </motion.button>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-game-dark-100 rounded-2xl p-8 max-w-md w-full border border-game-primary/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-game font-bold">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {authMode === 'login' ? (
                <LoginForm 
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setAuthMode('register')}
                />
              ) : (
                <RegisterForm 
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;