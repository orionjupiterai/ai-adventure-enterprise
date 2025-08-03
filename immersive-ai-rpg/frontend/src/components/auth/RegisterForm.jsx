import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@store';
import { authAPI } from '@services/api/auth';
import toast from 'react-hot-toast';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Register the user
      const response = await authAPI.register({
        email: data.email,
        username: data.username,
        password: data.password,
      });

      // Auto-login after successful registration
      await login({
        email: data.email,
        password: data.password,
      });

      toast.success('Account created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          className={`input w-full ${errors.username ? 'border-red-500' : ''}`}
          placeholder="Choose a username"
          {...register('username', {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters',
            },
            maxLength: {
              value: 20,
              message: 'Username must be less than 20 characters',
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: 'Username can only contain letters, numbers, and underscores',
            },
          })}
        />
        {errors.username && (
          <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
        )}
      </div>

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
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
          placeholder="Choose a strong password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              message: 'Password must contain uppercase, lowercase, number, and special character',
            },
          })}
        />
        {errors.password && (
          <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
          placeholder="Confirm your password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start">
        <input
          id="terms"
          type="checkbox"
          className="mt-1 mr-2"
          {...register('terms', {
            required: 'You must accept the terms and conditions',
          })}
        />
        <label htmlFor="terms" className="text-sm text-gray-300">
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>
      {errors.terms && (
        <p className="text-red-400 text-sm">{errors.terms.message}</p>
      )}

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
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </motion.button>

      {/* Switch to Login */}
      <div className="text-center text-sm">
        <span className="text-gray-400">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-game-primary hover:text-purple-400 font-medium transition-colors"
        >
          Sign in
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;