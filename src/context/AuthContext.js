import React from 'react';

export const AuthContext = React.createContext({
  isAuthenticated: false,
  isDemoMode: false,
  setIsAuthenticated: () => {},
  login: () => {},
  logout: () => {},
  enableDemoMode: () => {},
});
