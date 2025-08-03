import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from '@components/layout/MainLayout';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { useAuthStore } from '@store';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const GameMenuPage = lazy(() => import('./pages/GameMenuPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const WorldBuilderPage = lazy(() => import('./pages/WorldBuilderPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<LoadingSpinner />}>
            <LandingPage />
          </Suspense>
        } />
        
        <Route path="/menu" element={
          isAuthenticated ? (
            <Suspense fallback={<LoadingSpinner />}>
              <GameMenuPage />
            </Suspense>
          ) : <Navigate to="/" />
        } />
        
        <Route path="/game" element={
          isAuthenticated ? <MainLayout /> : <Navigate to="/" />
        }>
          <Route index element={
            <Suspense fallback={<LoadingSpinner />}>
              <GamePage />
            </Suspense>
          } />
          
          <Route path="world-builder" element={
            <Suspense fallback={<LoadingSpinner />}>
              <WorldBuilderPage />
            </Suspense>
          } />
          
          <Route path="character" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CharacterPage />
            </Suspense>
          } />
          
          <Route path="settings" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;