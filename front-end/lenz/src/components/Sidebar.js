// Sidebar.js
import React, { useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { AiOutlineSearch } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';
import { FiHeart, FiLogIn, FiLogOut } from 'react-icons/fi';
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline } from "react-icons/io5";
import './Sidebar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.replace('/', ''));
  const navigate = useNavigate();

  const tabs = [
    { id: 'home', icon: <FaHome />, label: 'Home' },
    { id: 'search', icon: <AiOutlineSearch />, label: 'Search' },
    //{ id: 'add', icon: <IoMdAdd />, label: 'Add' },
    { id: 'heart', icon: <FiHeart />, label: 'Favorites' },
    { id: 'profile', icon: <CgProfile />, label: 'Profile' },
    //{ id: 'pin', icon: <BsPin />, label: 'Pin' },
  ];

  return (
    <div className="sidebar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(tab.id);
            navigate(tab.id);
          }}
        >
          <div className="icon">{tab.icon}</div>
          <span className="label">{tab.label}</span>
        </div>
      ))}
      <div
        className={`tab ${activeTab === 'add' ? 'active' : ''}`}
        onClick={() => {
          navigate('/add', { state: { background: location } });
        }}
      >
        <div className="icon">
          <IoMdAdd />
        </div>  
        <span className="label">Add</span>
      </div>
      
      <div
        className={`tab ${activeTab === 'pin' ? 'active' : ''}`}
        onClick={() => {
          navigate('/pin', { state: { background: location } });
        }}
      >
        <div className="icon">
          <FiLogOut />
        </div>  
        <span className="label">Logout</span>
      </div>
    </div>  );
};

export default Sidebar;
