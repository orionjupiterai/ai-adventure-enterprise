import React from 'react';
import { Navigate } from 'react-router-dom';

// LoginPage is now integrated into LandingPage
const LoginPage = () => {
  return <Navigate to="/" replace />;
};

export default LoginPage;