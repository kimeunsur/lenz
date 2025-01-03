import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-layout">
          <Sidebar />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
