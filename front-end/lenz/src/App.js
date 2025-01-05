import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Add from './pages/Add';
import Favorites from './pages/Favorites';
import Pin from './pages/Pin';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Modal from './components/Modal'; 

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
      <AppRoutes
        isLoggedIn={isLoggedIn}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </Router>
  );
}

function AppRoutes({ isLoggedIn, handleLogin, handleLogout }) {
  // 현재 location
  const location = useLocation();
  // location.state에 background가 있으면 모달 오버레이로 취급
  const background = location.state && location.state.background;

  if (!isLoggedIn) {
    // 로그인이 안 되어 있으면 Login 컴포넌트만 표시
    return <Login onLogin={handleLogin} />;
  }

  // 로그인이 되어 있으면 실제 페이지 + 모달 라우트 처리
  return (
    <>
      <div className="app-layout">
        <Sidebar />
        <div className="page-content">
          {/* 
            1) location을 background || location 으로 전달 
            배경이 있으면 기존화면을 그리면서, 
            배경이 없으면(직접 /add로 진입 등) 전체가 교체됨 
          */}
          <Routes location={background || location}>
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

      {background && (
        <Routes>
          <Route path="/pin" element={<Pin onLogout={handleLogout} />} />
          <Route path="/add" element={ <Add /> }/>
        </Routes>
      )}
    </>
  );
}

export default App;
