import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addAuthChangeListener,
  getStoredUser,
  logoutUser,
  storeUser
} from "../services/Auth/authStorage";
import { getProfile } from "../services/profileApi";
import ProfileOverview from "./components/ProfileOverview/ProfileOverview";
import ProfileSession from "./components/ProfileSession/ProfileSession";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import "./Profile.css";

function Profile({ theme, onThemeToggle }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return addAuthChangeListener(() => {
      setUser(getStoredUser());
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const profileData = await getProfile();
        const backendUser = profileData?.user;

        if (!backendUser) {
          throw new Error("Profile response was missing user details.");
        }

        const cachedUser = getStoredUser();
        const verifiedUser = {
          ...cachedUser,
          ...backendUser,
          loggedInAt: cachedUser?.loggedInAt || new Date().toISOString()
        };

        storeUser(verifiedUser);

        if (isActive) {
          setUser(verifiedUser);
        }
      } catch (error) {
        console.error("Profile verification failed:", error);
        logoutUser();
        navigate("/login?reason=session-expired", { replace: true });
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    queueMicrotask(() => {
      loadProfile();
    });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-state" aria-live="polite">
          Checking your session...
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-state profile-state--error">
          Please log in to view your profile.
        </section>
      </main>
    );
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
