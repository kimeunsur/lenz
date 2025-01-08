import React, { useState } from 'react';
import './deco/Pin.css';
import { useNavigate } from 'react-router-dom';

const Pin = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div className="page-layout">
        <h1>정말 로그아웃 하시겠습니까?</h1>
        <div className="buttons">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
};

export default Pin;
