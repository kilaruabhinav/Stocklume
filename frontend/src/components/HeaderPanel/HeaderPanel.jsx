// src/components/HeaderPanel/HeaderPanel.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  addAuthChangeListener,
  getStoredUser
} from '../../services/Auth/authStorage';
import {
  loadCompare,
  loadDashboard,
  loadPortfolio,
  loadProfile
} from '../../routes/routeLoaders';
import './HeaderPanel.css';

const preloadByPath = {
  "/dashboard": loadDashboard,
  "/compare": loadCompare,
  "/portfolio": loadPortfolio,
  "/profile": loadProfile
};

function getNavEvents(path) {
  const preload = preloadByPath[path];

  if (!preload) {
    return {};
  }

  return {
    onMouseEnter: preload,
    onFocus: preload
  };
}

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
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} {...getNavEvents("/dashboard")}>
          Dashboard
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} {...getNavEvents("/compare")}>
          Compare
        </NavLink>
        {user ? (
          <>
            <NavLink to="/portfolio" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} {...getNavEvents("/portfolio")}>
              Portfolio
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} {...getNavEvents("/profile")}>
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
