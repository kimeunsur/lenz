import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Add from './pages/Add';
import Favorites from './pages/Favorites';
import Pin from './pages/Pin';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [token, setToken] = React.useState(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Token load error:', error);
    }
  }, []);

  const handleLogin = (jwtToken) => {
    setIsLoggedIn(true);
    setToken(jwtToken);
    console.log("JWT TOKEN 저장:", jwtToken);
    localStorage.setItem('token', jwtToken);
  };



  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem('token');
  }

  return (
    <Router>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-layout">
          <Sidebar />
          <div className="page-content">
            <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/add" element={<Add />} />
            <Route path="/heart" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pin" element={<Pin onLogout={handleLogout} />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
