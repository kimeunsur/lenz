import React, { useState } from 'react';
import './Login.css';
import SignupPopup from './SignupPopup';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            alert('로그인 성공');
            console.log('Token:', data.token); // Token 출력
            // 로그인 성공 시 JWT 저장 (선택 사항)
            localStorage.setItem('token', data.token);
            onLogin(data.token);
        } else {
            const errorData = await response.json();
            alert(`로그인 실패: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버 오류');
    }
};


  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const handleSignupOpen = () => setIsSignupOpen(true);
  const handleSignupClose = () => setIsSignupOpen(false);

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>LenZ</h1>
        <p>이메일 계정으로 로그인</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input 
              id="username"
              type="email"
              placeholder="이메일 주소"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">로그인</button>
        </form>
        <div className="login-footer">
          <p>계정이 없으세요?</p>
          <button onClick={handleSignupOpen}>회원가입</button>
        </div>
        {isSignupOpen && <SignupPopup onClose={handleSignupClose} />}
      </div>
    </div>
  );
};

export default Login;
