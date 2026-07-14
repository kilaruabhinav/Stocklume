// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderPanel from './components/HeaderPanel/HeaderPanel';
import { useTheme } from './hooks/useTheme';
import "./App.css";
import Home from './Home/Home';
import Dashboard from './components/Dashboard/Dashboard';
import Compare from './components/Compare/Compare';
import Login from './Login/Login';
import Profile from './Profile/Profile';
import Register from './Register/Register';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="app-layout">
        <HeaderPanel />
        
        {/* React Router handles swapping components right here */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Compare/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile theme={theme} onThemeToggle={toggleTheme} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
