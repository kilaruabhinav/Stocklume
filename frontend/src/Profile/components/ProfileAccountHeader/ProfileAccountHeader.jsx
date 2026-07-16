import { formatDate } from "../../../Portfolio/utils/portfolioFormatters";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import "./ProfileAccountHeader.css";

function ProfileAccountHeader({ onThemeToggle, theme, user }) {
  const displayName = user?.name || user?.email || "Stocklume User";
  const email = user?.email || "Not available";
  const createdAt = user?.created_at || user?.createdAt;

  return (
    <section className="profile-account-header">
      <div className="profile-account-header__avatar" aria-hidden="true">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="profile-account-header__body">
        <div className="profile-account-header__identity">
          <div className="profile-account-header__title-row">
            <h1>{displayName}</h1>
            <span>Active</span>
          </div>
          <p>{email}</p>
        </div>
        <div className="profile-account-header__meta">
          <dl>
            <div>
              <dt>Account created</dt>
              <dd>{createdAt ? formatDate(createdAt) : "Not available"}</dd>
            </div>
          </dl>
          <div className="profile-theme-control">
            <span>Dark mode</span>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileAccountHeader;
