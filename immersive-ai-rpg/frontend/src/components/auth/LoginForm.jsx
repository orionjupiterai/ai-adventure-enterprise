import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@store';
import { authAPI } from '@services/api/auth';
import toast from 'react-hot-toast';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe,
      });
      
      toast.success('Welcome back!');
      onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      toast.error(errorMessage);
      
      // Check for specific error types
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
          placeholder="your@email.com"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <button
            type="button"
            className="text-sm text-game-primary hover:text-purple-400 transition-colors"
            onClick={() => toast('Password reset coming soon!')}
          >
            Forgot password?
          </button>
        </div>
        <input
          id="password"
          type="password"
          className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
          placeholder="Enter your password"
          {...register('password', {
            required: 'Password is required',
          })}
        />
        {errors.password && (
          <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          className="mr-2"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <label htmlFor="remember" className="text-sm text-gray-300">
          Remember me for 30 days
        </label>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </motion.button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-game-dark-100 text-gray-400">Or continue with</span>
        </div>
      </div>

      {/* Demo Account Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          // Fill in demo credentials
          handleSubmit({
            email: 'demo@immersive-rpg.com',
            password: 'DemoAccount123!',
          })();
        }}
        className="btn-secondary w-full py-3 font-semibold"
      >
        Try Demo Account
      </motion.button>

      {/* Switch to Register */}
      <div className="text-center text-sm mt-6">
        <span className="text-gray-400">Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-game-primary hover:text-purple-400 font-medium transition-colors"
        >
          Create one
        </button>
      </div>
    </form>
  );
};

export default LoginForm;