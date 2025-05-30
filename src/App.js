import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { GroupProvider, useAllGroupsCache } from './contexts/GroupContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <GroupProvider>
        <GlobalLoadingIndicator />
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Login setIsAuthenticated={setIsAuthenticated} />
              } 
            />
            <Route 
              path="/dashboard/*" 
              element={
                isAuthenticated ? 
                <Dashboard setIsAuthenticated={setIsAuthenticated} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </GroupProvider>
    </Router>
  );
}

const GlobalLoadingIndicator = () => {
  const { isLoadingGroups } = useAllGroupsCache();

  if (!isLoadingGroups) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      fontSize: '1.2rem',
      fontWeight: 'bold'
    }}>
      Carregando dados iniciais...
      <div className="spinner mt-4">⚙️</div>
    </div>
  );
};

export default App; 