import React, { useState } from 'react';
import './SignupPopup.css';

const SignupPopup = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
