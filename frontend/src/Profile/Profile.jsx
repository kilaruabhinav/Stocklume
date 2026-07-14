import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addAuthChangeListener,
  getStoredUser,
  logoutUser
} from "../services/Auth/authStorage";
import ProfileOverview from "./components/ProfileOverview/ProfileOverview";
import ProfileSession from "./components/ProfileSession/ProfileSession";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import "./Profile.css";

function Profile({ theme, onThemeToggle }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return undefined;
    }

    return addAuthChangeListener(() => {
      const nextUser = getStoredUser();
      setUser(nextUser);

      if (!nextUser) {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate, user]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div>
          <span className="profile-eyebrow">Signed In</span>
          <h1>Your Profile</h1>
          <p>Temporary account details for the current Stocklume session.</p>
        </div>

        <div className="profile-header__actions">
          <div className="profile-theme-control">
            <span>Dark mode</span>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          </div>
          <Link className="profile-btn profile-btn--primary" to="/dashboard">
            Open Dashboard
          </Link>
          <button className="profile-btn profile-btn--danger" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <div className="profile-grid">
        <ProfileOverview user={user} />
        <ProfileSession user={user} />
      </div>
    </main>
  );
}

export default Profile;
