import React from 'react';
import { Navigate } from 'react-router-dom';

// HomePage redirects to GameMenuPage
const HomePage = () => {
  return <Navigate to="/menu" replace />;
};

export default HomePage;