import React, { useState } from 'react';
import './Login.css';
import SignupPopup from './SignupPopup';

const Login = ({ onLogin }) => {
  const [email, setemail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ email, password }),
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
    <div className="pink">
      <div className="login-box">
        <h1>LenZ</h1>
        <p>Log in with you Email account</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setemail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="login-footer">
          <p>Don't you have an account?</p>
          <button onClick={handleSignupOpen}>Sign up</button>
        </div>
        {isSignupOpen && <SignupPopup onClose={handleSignupClose} />}
      </div>
    </div>
  );
};

export default Login;
