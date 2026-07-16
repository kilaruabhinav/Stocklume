// src/components/HeaderPanel/HeaderPanel.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  addAuthChangeListener,
  getStoredUser
} from '../../services/Auth/authStorage';
import './HeaderPanel.css';

const HeaderPanel = () => {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    return addAuthChangeListener(() => {
      setUser(getStoredUser());
    });
  }, []);

  return (
    <header className="header-panel">
      <div className="header-left">
        <div className="logo-container">
          <span className="logo-text">Stock<span className="logo-accent">lume</span></span>
        </div>
      </div>

      <nav className="header-nav">
        {/* NavLink automatically injects an 'active' class when path matches */}
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Home
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Dashboard
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Compare
        </NavLink>
        {user ? (
          <>
            <NavLink to="/portfolio" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Portfolio
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Profile
            </NavLink>
            
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
};

export default HeaderPanel;
