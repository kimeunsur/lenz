import React, { useState } from 'react';
import './Login.css';
import SignupPopup from './SignupPopup';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(); // 로그인
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
            <label>Email</label>
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
