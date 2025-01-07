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
import UserProfile from './pages/UserProfile'; // 사용자 프로필 컴포넌트

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // 토큰 초기화
  const initializeToken = () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  // 컴포넌트 마운트 시 토큰 로드
  useEffect(() => {
    initializeToken();
  }, []);

  // 로그인 처리
  const handleLogin = (jwtToken) => {
    setIsLoggedIn(true);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
    console.log("JWT TOKEN 저장:", jwtToken);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem('token');
  };

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
  const location = useLocation();
  const background = location.state?.background;

  // 로그인 여부에 따른 렌더링
  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <AuthenticatedRoutes
          location={location}
          background={background}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
}

function AuthenticatedRoutes({ location, background, handleLogout }) {
  const [activePopup, setActivePopup] = useState(null); // 현재 활성화된 팝업 경로

  const openPopup = (popupPath) => {
      setActivePopup(popupPath);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content">
        {/* 기본 페이지 라우트 */}
        <Routes location={background || location}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/add" element={<Add />} />
          <Route path="/heart" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pin" element={<Pin onLogout={handleLogout} />} />
        </Routes>
      </div>

      {/* 모달 라우트 처리 (한 번에 하나만 표시) */}
      { activePopup === "/pin" && (
        <Pin onLogout={handleLogout} closePopup={closePopup} />
      )}
      { activePopup === "/add" && (
        <Add closePopup={closePopup} />
      )}


        <Routes>
          <Route path="/pin" 
          element={<PopupWrapper path="/pin" openPopup={openPopup} />}
          />
          <Route path="/add" 
          element={<PopupWrapper path="/add" openPopup={openPopup} />}
          />
        </Routes>
    </div>
  );
}

// 팝업 경로를 활성화하는 감시 컴포넌트
function PopupWrapper({ path, openPopup }) {
  useEffect(() => {
    openPopup(path);
    return () => openPopup(null); // 컴포넌트 언마운트 시 팝업 닫기
  }, [path, openPopup]);

  return null; // UI 요소가 필요 없는 감시용 컴포넌트
}

export default App;
