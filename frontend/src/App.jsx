// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderPanel from './components/HeaderPanel/HeaderPanel';
import { useTheme } from './hooks/useTheme';
import "./App.css";
import Home from './Home/Home';
import Login from './Login/Login';
import PageLoader from './components/PageLoader/PageLoader';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Register from './Register/Register';
import {
  loadCompare,
  loadDashboard,
  loadPortfolio,
  loadProfile
} from './routes/routeLoaders';

const Dashboard = lazy(loadDashboard);
const Compare = lazy(loadCompare);
const Portfolio = lazy(loadPortfolio);
const Profile = lazy(loadProfile);

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="app-layout">
        <HeaderPanel />
        
        {/* React Router handles swapping components right here */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProtectedRoute><Profile theme={theme} onThemeToggle={toggleTheme} /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
