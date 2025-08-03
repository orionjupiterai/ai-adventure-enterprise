import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-20 h-20'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-game-dark-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-game-primary border-r-transparent border-b-transparent border-l-transparent"></div>
      </motion.div>
      
      {text && (
        <div className={`${textSizes[size]} text-gray-400 loading-dots`}>
          {text.split('').map((char, i) => (
            char === '.' ? <span key={i}>.</span> : char
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;