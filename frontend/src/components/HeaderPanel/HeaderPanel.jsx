// src/components/HeaderPanel/HeaderPanel.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  addAuthChangeListener,
  getStoredUser,
  logoutUser
} from '../../services/Auth/authStorage';
import './HeaderPanel.css';

const HeaderPanel = () => {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    return addAuthChangeListener(() => {
      setUser(getStoredUser());
    });
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

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
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Profile
            </NavLink>
            <button className="nav-logout-btn" type="button" onClick={handleLogout}>
              Logout
            </button>
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
