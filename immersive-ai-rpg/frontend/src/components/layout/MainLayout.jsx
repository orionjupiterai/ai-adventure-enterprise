import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-game-dark-300">
      <Header />
      <main className="h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;