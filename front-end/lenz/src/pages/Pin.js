import React from 'react';
import './deco/Pin.css';
import { useNavigate } from 'react-router-dom';
const Pin = ({onLogout}) => {
    const navigate = useNavigate();

    const handleLogout = ()=> {
        localStorage.removeItem('token');
        onLogout();
        navigate('/');
    }
  return(
    <div className="page-layout">
        <h1>정말 로그아웃 하시겠습니까?</h1>
        <button onClick={handleLogout}>Logout</button>
    </div>
  )
};

export default Pin;
