import React, { useState } from 'react';
import './SignupPopup.css';

const SignupPopup = ({ onClose }) => {
  const [email, setemail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password }),
      });

      if (response.ok) {
        alert('회원가입 성공');
        onClose();
      } else {
        alert('회원가입 실패');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('서버 오류');
    }
  };


  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setemail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Account</button>
        </form>
        <button onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SignupPopup;
