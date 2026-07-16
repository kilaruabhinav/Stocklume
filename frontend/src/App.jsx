// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderPanel from './components/HeaderPanel/HeaderPanel';
import { useTheme } from './hooks/useTheme';
import "./App.css";
import Home from './Home/Home';
import Dashboard from './components/Dashboard/Dashboard';
import Compare from './components/Compare/Compare';
import Login from './Login/Login';
import Portfolio from './Portfolio/Portfolio';
import Profile from './Profile/Profile';
import Register from './Register/Register';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="app-layout">
        <HeaderPanel />
        
        {/* React Router handles swapping components right here */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile theme={theme} onThemeToggle={toggleTheme} /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
