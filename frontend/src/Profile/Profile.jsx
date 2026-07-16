import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/Auth/authStorage";
import AccountActions from "./components/AccountActions/AccountActions";
import ProfileAccountHeader from "./components/ProfileAccountHeader/ProfileAccountHeader";
import RecentActivity from "./components/RecentActivity/RecentActivity";
import SimulationSummary from "./components/SimulationSummary/SimulationSummary";
import WatchlistSummary from "./components/WatchlistSummary/WatchlistSummary";
import { useProfileDashboard } from "./hooks/useProfileDashboard";
import "./Profile.css";

function Profile({ theme, onThemeToggle }) {
  const navigate = useNavigate();
  const {
    user,
    profileLoading,
    profileError,
    simulationState,
    simulationSummary,
    watchlistState
  } = useProfileDashboard();

  useEffect(() => {
    if (profileError) {
      navigate("/login?reason=session-expired", { replace: true });
    }
  }, [navigate, profileError]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  if (profileLoading) {
    return (
      <main className="profile-page">
        <section className="profile-state" aria-live="polite">
          Checking your session...
        </section>
      </main>
    );
  }

  if (!user || profileError) {
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
      <ProfileAccountHeader
        onThemeToggle={onThemeToggle}
        theme={theme}
        user={user}
      />

      <div className="profile-dashboard-grid">
        <SimulationSummary
          error={simulationState.error}
          loading={simulationState.loading}
          summary={simulationSummary}
        />
        <WatchlistSummary
          error={watchlistState.error}
          items={watchlistState.items}
          loading={watchlistState.loading}
        />
        <RecentActivity
          error={simulationState.error}
          loading={simulationState.loading}
          trades={simulationState.trades}
        />
        <AccountActions onLogout={handleLogout} />
      </div>
    </main>
  );
}

export default Profile;
